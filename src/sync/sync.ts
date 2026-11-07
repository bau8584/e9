// 기기 기록(localStorage)을 기준으로 두고 Firestore 와 맞춘다. 실패해도 앱은 지금처럼 로컬로 돌고, 뒤에서 조용히 다시 시도한다.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type User } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getFirestore, onSnapshot, runTransaction, serverTimestamp, setLogLevel, type Firestore } from 'firebase/firestore';
import { characters, REWARD_SCORE, type CharacterId } from '../data';
import { loadLibrary, saveLibrary, STORAGE_KEY as LIBRARY_KEY } from '../library.mjs';
import { getProgress, replaceProgress, subscribe } from '../store/store';
import { firebaseConfig } from './firebaseConfig';
import { characterOfMission, clampStamp, fromRemoteProgress, isBlankProgress, libraryTooLarge, mergeLibraries, newClaims, nextRetryDelay, planProgress, RETRY_MIN, runSteps, toRemoteProgress, usableLibrary, type LibraryDoc } from './merge';

const META_KEY = 'hipdok:sync:v1';

interface Meta {
  progressUpdatedAt: number;
  libraryUpdatedAt: number;
  /** 서버 반영을 기다리는 미션. 초기화해도 지우지 않는다. */
  pending: string[];
  /** 서버에 claim 이 있는 것을 확인한 미션 */
  claimed: string[];
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

function readMeta(): Meta {
  try {
    const r = JSON.parse(localStorage.getItem(META_KEY) ?? '{}');
    return {
      progressUpdatedAt: Number.isSafeInteger(r.progressUpdatedAt) ? clampStamp(r.progressUpdatedAt) : 0,
      libraryUpdatedAt: Number.isSafeInteger(r.libraryUpdatedAt) ? clampStamp(r.libraryUpdatedAt) : 0,
      pending: strings(r.pending),
      claimed: strings(r.claimed),
    };
  } catch {
    return { progressUpdatedAt: 0, libraryUpdatedAt: 0, pending: [], claimed: [] };
  }
}

const metaListeners = new Set<() => void>();
const libraryListeners = new Set<(data: LibraryDoc) => void>();

function writeMeta(change: Partial<Meta>) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ ...readMeta(), ...change }));
  } catch {
    /* 저장이 막혔으면 다음 동기화에서 다시 계산한다 */
  }
  metaListeners.forEach((listen) => listen());
}

const STEP_TIMEOUT = 20_000;

let db: Firestore | null = null;
let started = false;
let running = false;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = RETRY_MIN;
/** 실패 뒤 이 시각 전에는 다시 시도하지 않는다. 사용자가 계속 고쳐도 간격을 지킨다. */
let retryNotBefore = 0;
let libraryPaused = false;
let lastProgressText = '';

/** file:// 로 연 단일 파일과 시험 환경은 Firebase 를 쓰지 않는다. */
const canUseFirebase = (): boolean => import.meta.env.MODE !== 'test' && location.protocol !== 'file:';

function database(): Firestore | null {
  if (db || !canUseFirebase()) return db;
  try {
    const app = getApps()[0] ?? initializeApp(import.meta.env.VITE_FIREBASE_EMULATOR ? { ...firebaseConfig, projectId: 'demo-hipdok' } : firebaseConfig);
    setLogLevel('silent');
    db = getFirestore(app);
    // 개발 시험 전용. 실제 DB 대신 내 컴퓨터의 에뮬레이터에 붙는다. 배포 빌드에는 값이 없다.
    if (import.meta.env.VITE_FIREBASE_EMULATOR) {
      connectFirestoreEmulator(db, '127.0.0.1', 5230);
      connectAuthEmulator(getAuth(app), 'http://127.0.0.1:5231', { disableWarnings: true });
    }
  } catch {
    db = null;
  }
  return db;
}

const withTimeout = <T,>(work: Promise<T>): Promise<T> =>
  Promise.race([work, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), STEP_TIMEOUT))]);

async function currentUser(): Promise<User> {
  const auth = getAuth();
  await auth.authStateReady();
  return auth.currentUser ?? (await signInAnonymously(auth)).user;
}

function readLocalLibrary(): { data: LibraryDoc | null; blocked: boolean } {
  try {
    if (localStorage.getItem(LIBRARY_KEY) === null) return { data: null, blocked: false };
    const { data, blocked } = loadLibrary(localStorage);
    return { data: blocked ? null : (data as LibraryDoc), blocked };
  } catch {
    return { data: null, blocked: true };
  }
}

const progressText = () => JSON.stringify(toRemoteProgress(getProgress()));

async function syncUser(store: Firestore, uid: string) {
  const ref = doc(store, 'users', uid);
  const before = readMeta();
  const localProgress = getProgress();
  const local = readLocalLibrary();
  // 옛 기록은 시각이 없다. 있는 기록이면 가장 오래된 값으로 친다.
  const progressAt = before.progressUpdatedAt || (isBlankProgress(localProgress) ? 0 : 1);
  const libraryAt = before.libraryUpdatedAt || (local.data ? 1 : 0);

  const plan = await withTimeout(
    runTransaction(store, async (tx) => {
      const remote = (await tx.get(ref)).data() ?? {};
      const remoteProgressAt = typeof remote.progressUpdatedAt === 'number' ? remote.progressUpdatedAt : 0;
      const remoteLibraryAt = typeof remote.libraryUpdatedAt === 'number' ? remote.libraryUpdatedAt : 0;
      const write: Record<string, unknown> = {};
      const progress = planProgress(localProgress, progressAt, Boolean(remote.progress), remoteProgressAt);
      if (progress.push) {
        write.progress = toRemoteProgress(localProgress);
        write.progressUpdatedAt = progressAt;
      }
      // 서고를 못 읽는 상태면 원본 보존이 먼저라 건드리지 않는다.
      let library: LibraryDoc | null = null;
      const remoteLibrary = usableLibrary(remote.library);
      if (!local.blocked && (local.data || remoteLibrary)) {
        library = mergeLibraries(local.data, libraryAt, remoteLibrary, remoteLibraryAt);
        if (!libraryTooLarge(library) && JSON.stringify(library) !== JSON.stringify(remote.library)) {
          write.library = JSON.parse(JSON.stringify(library));
          write.libraryUpdatedAt = clampStamp(Math.max(libraryAt, remoteLibraryAt, 1));
        }
      }
      if (Object.keys(write).length) tx.set(ref, write, { merge: true });
      return { progress, remote, remoteProgressAt, remoteLibraryAt, library };
    }),
  );

  const paused = Boolean(plan.library && libraryTooLarge(plan.library));
  if (paused !== libraryPaused) {
    libraryPaused = paused;
    metaListeners.forEach((listen) => listen());
  }

  // 동기화하는 사이에 사용자가 또 고쳤으면 그 기록이 더 새것이니 덮지 않는다.
  const now = readMeta();
  const change: Partial<Meta> = {};
  if (plan.progress.pull && now.progressUpdatedAt === before.progressUpdatedAt) {
    replaceProgress(fromRemoteProgress(plan.remote.progress, getProgress().screen));
    lastProgressText = progressText();
    change.progressUpdatedAt = plan.remoteProgressAt;
  } else if (plan.progress.push && !now.progressUpdatedAt) {
    change.progressUpdatedAt = progressAt;
  }
  if (plan.library) {
    const latest = readLocalLibrary();
    if (!latest.blocked) {
      const merged = mergeLibraries(latest.data, now.libraryUpdatedAt || libraryAt, plan.library, Math.max(libraryAt, plan.remoteLibraryAt));
      if (JSON.stringify(merged) !== JSON.stringify(latest.data) && saveLibrary(localStorage, merged)) {
        libraryListeners.forEach((listen) => listen(merged));
      }
      if (now.libraryUpdatedAt === before.libraryUpdatedAt) change.libraryUpdatedAt = Math.max(libraryAt, plan.remoteLibraryAt, 1);
    }
  }
  if (Object.keys(change).length) writeMeta(change);
}

/** 팬덤 문서가 없으면 0으로 만든 뒤, claim 이 없을 때만 claim 과 +20 을 함께 쓴다. */
async function claimMission(store: Firestore, uid: string, missionId: string, characterId: CharacterId) {
  const fandomRef = doc(store, 'fandoms', characterId);
  const claimRef = doc(store, 'users', uid, 'claims', missionId);
  await withTimeout(
    runTransaction(store, async (tx) => {
      if (!(await tx.get(fandomRef)).exists()) tx.set(fandomRef, { score: 0 });
    }),
  );
  await withTimeout(
    runTransaction(store, async (tx) => {
      if ((await tx.get(claimRef)).exists()) return;
      const score = (await tx.get(fandomRef)).data()?.score;
      if (typeof score !== 'number') throw new Error('fandom');
      tx.set(claimRef, { characterId, missionId, createdAt: serverTimestamp() });
      tx.set(fandomRef, { score: score + REWARD_SCORE, lastMissionId: missionId });
    }),
  );
}

/** 미션 하나가 실패해도 나머지는 받는다. 실패한 미션은 대기 목록에 남아 다음에 다시 시도한다. */
async function syncClaims(store: Firestore, uid: string) {
  const failed = await runSteps(
    readMeta().pending.map((missionId) => async () => {
      const characterId = characterOfMission(missionId);
      if (characterId) await claimMission(store, uid, missionId, characterId);
      const meta = readMeta();
      writeMeta({ pending: meta.pending.filter((id) => id !== missionId), claimed: characterId ? [...meta.claimed, missionId] : meta.claimed });
    }),
  );
  if (failed) throw new Error('claims');
}

function schedule(delay: number) {
  if (!started) return;
  clearTimeout(timer);
  timer = setTimeout(run, Math.max(delay, retryNotBefore - Date.now()));
}

async function run() {
  if (running) {
    rerun = true;
    return;
  }
  const store = database();
  if (!store) return;
  running = true;
  let failed: boolean;
  try {
    const user = await withTimeout(currentUser());
    // 진행, 서고 동기화가 실패해도 팬덤 적립은 따로 시도한다.
    failed = await runSteps([() => syncUser(store, user.uid), () => syncClaims(store, user.uid)]);
  } catch {
    failed = true;
  }
  running = false;
  if (failed) {
    // 조용히 다시 시도한다. 앱은 계속 로컬로 동작한다.
    retryNotBefore = Date.now() + retryDelay;
    schedule(retryDelay);
    retryDelay = nextRetryDelay(retryDelay);
  } else {
    retryDelay = RETRY_MIN;
    retryNotBefore = 0;
  }
  if (rerun) {
    rerun = false;
    schedule(1000);
  }
}

function queueClaims() {
  const meta = readMeta();
  const fresh = newClaims(getProgress().rewardedMissions, meta.claimed, meta.pending);
  if (fresh.length) writeMeta({ pending: [...meta.pending, ...fresh] });
}

function onProgressChange() {
  const text = progressText();
  if (text === lastProgressText) return;
  lastProgressText = text;
  queueClaims();
  writeMeta({ progressUpdatedAt: Date.now() });
  schedule(1000);
}

/** 서고를 저장한 뒤 부른다. */
export function notifyLibraryChanged() {
  if (!started) return;
  writeMeta({ libraryUpdatedAt: Date.now() });
  schedule(1000);
}

/** 서버에서 받은 책이 합쳐지면 내 방 화면을 새로 그린다. */
export function onLibraryMerged(listen: (data: LibraryDoc) => void) {
  libraryListeners.add(listen);
  return () => {
    libraryListeners.delete(listen);
  };
}

export function startSync() {
  if (started || !database()) return;
  started = true;
  lastProgressText = progressText();
  queueClaims();
  subscribe(onProgressChange);
  window.addEventListener('online', () => {
    retryNotBefore = 0;
    schedule(0);
  });
  let lastVisible = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastVisible > 60_000) {
      lastVisible = Date.now();
      schedule(0);
    }
  });
  schedule(0);
}

/** 이 미션의 팬덤 점수가 이미 서버에 들어갔는지. 초기화 뒤 다시 깬 미션을 구분한다. */
export const isMissionClaimed = (missionId: string): boolean => readMeta().claimed.includes(missionId);

const subscribeMeta = (listen: () => void) => {
  metaListeners.add(listen);
  return () => {
    metaListeners.delete(listen);
  };
};

/** 서고가 커서 서버 저장을 쉬는 중인지. 기기 기록은 그대로다. */
export const useLibrarySyncPaused = (): boolean => useSyncExternalStore(subscribeMeta, () => libraryPaused);

export type FandomScores = Record<CharacterId, number>;

/** 화면에 있는 동안만 실제 팬덤 점수를 구독한다. 서버와 연결이 안 되면 null. */
export function useFandomScores(): FandomScores | null {
  const [scores, setScores] = useState<FandomScores | null>(null);
  const pendingText = useSyncExternalStore(subscribeMeta, () => readMeta().pending.join(','));
  useEffect(() => {
    const store = database();
    if (!store) return;
    let stop = () => {};
    let retry: ReturnType<typeof setTimeout> | undefined;
    const listen = () => {
      stop = onSnapshot(
        collection(store, 'fandoms'),
        { includeMetadataChanges: true },
        (snap) => {
          if (snap.metadata.fromCache) {
            setScores(null);
            return;
          }
          const next = Object.fromEntries(characters.map((c) => [c.id, 0])) as FandomScores;
          snap.forEach((d) => {
            const score = d.data().score;
            if (d.id in next && typeof score === 'number' && Number.isFinite(score)) next[d.id as CharacterId] = score;
          });
          setScores(next);
        },
        () => {
          setScores(null);
          retry = setTimeout(listen, 30_000);
        },
      );
    };
    listen();
    return () => {
      clearTimeout(retry);
      stop();
    };
  }, []);
  if (!scores) return null;
  // 아직 서버에 도착 안 한 내 보상도 바로 보이게 더해 둔다.
  const shown = { ...scores };
  for (const id of pendingText ? pendingText.split(',') : []) {
    const character = characterOfMission(id);
    if (character) shown[character] += REWARD_SCORE;
  }
  return shown;
}
