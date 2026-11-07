// 앱 전체가 함께 보는 진행 기록. 바뀔 때마다 이 기기 브라우저(localStorage)에 저장한다.
// 저장에 실패해도 화면의 기록은 지우지 않고, 안내와 다시 시도 버튼을 띄운다.
import { useSyncExternalStore } from 'react';
import type { CharacterId } from '../data';
import * as rules from './progress';
import type { Progress, Screen } from './progress';

export const STORAGE_KEY = 'hipdok:v1';

export interface Snapshot {
  progress: Progress;
  saveFailed: boolean;
}

function readSaved(): Progress {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? rules.sanitize(JSON.parse(text)) : rules.createInitial();
  } catch {
    return rules.createInitial();
  }
}

let snapshot: Snapshot = { progress: readSaved(), saveFailed: false };
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listen) => listen());
}

function commit(progress: Progress) {
  if (progress === snapshot.progress) return;
  let saveFailed = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    saveFailed = true;
  }
  publish({ progress, saveFailed });
}

export const getProgress = (): Progress => snapshot.progress;

export function subscribe(listen: () => void) {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

/** 화면에서 진행 기록을 볼 때 쓴다. 기록이 바뀌면 화면이 저절로 다시 그려진다. */
export const useSnapshot = (): Snapshot => useSyncExternalStore(subscribe, () => snapshot);

/** 저장소에 있는 값을 다시 읽는다(다른 탭에서 바뀐 경우, 새로고침 시험용). */
export function reloadFromStorage() {
  publish({ progress: readSaved(), saveFailed: false });
}

export function retrySave() {
  const current = snapshot.progress;
  snapshot = { progress: { ...current }, saveFailed: false };
  commit(current);
}

export const goTo = (screen: Screen) => {
  if (snapshot.progress.screen !== screen) commit(rules.moveTo(snapshot.progress, screen));
};

export const startOnboarding = (favoriteId?: CharacterId) =>
  commit({
    ...snapshot.progress,
    screen: 'onboarding',
    favoriteId: favoriteId ?? snapshot.progress.favoriteId,
  });

export const pickFavorite = (favoriteId: CharacterId) => commit({ ...snapshot.progress, favoriteId });

export function completeOnboarding(nickname: string, favoriteId: CharacterId) {
  const next = rules.completeOnboarding(snapshot.progress, nickname, favoriteId);
  if (next !== snapshot.progress) saveNicknameDraft('');
  commit(next);
}

/** 내 방에서 이름을 바꾸면 입덕 닉네임도 같이 바꾼다. */
export const renameNickname = (raw: string) => {
  const nickname = rules.cleanNickname(raw);
  if (nickname && nickname !== snapshot.progress.nickname) commit({ ...snapshot.progress, nickname });
};

export const markDmRead = () => {
  if (!snapshot.progress.dmRead) commit({ ...snapshot.progress, dmRead: true });
};

export const chooseReply = (replyId: string) => commit(rules.chooseReply(snapshot.progress, replyId));

export function answerQuiz(optionId: string): boolean {
  const { next, correct } = rules.answerQuiz(snapshot.progress, optionId);
  commit(next);
  return correct;
}

export const clearWrongAnswer = () => commit({ ...snapshot.progress, lastWrongOptionId: null });

/** 받는 카드는 미션마다 정해져 있다. */
export const drawCard = () => commit(rules.drawCard(snapshot.progress));

/** 서버의 더 새로운 기록으로 바꾼다. 처음 화면에 있었고 입덕 기록이 왔으면 홈으로 보낸다. */
export function replaceProgress(next: Progress) {
  const landed = next.screen === 'landing' && Boolean(next.nickname && next.favoriteId);
  commit(landed ? { ...next, screen: 'home' } : next);
}

const NICKNAME_DRAFT_KEY = 'hipdok:nicknameDraft';

/** 입덕 신고서에 적던 닉네임. 새로고침해도 남게 따로 둔다. */
export function readNicknameDraft(): string {
  try {
    return window.localStorage.getItem(NICKNAME_DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveNicknameDraft(text: string) {
  try {
    if (text) window.localStorage.setItem(NICKNAME_DRAFT_KEY, text);
    else window.localStorage.removeItem(NICKNAME_DRAFT_KEY);
  } catch {
    /* 저장이 막혀도 입력은 화면에 남는다 */
  }
}

/** 입덕 진행 기록을 지우고 첫 화면으로. 서고는 건드리지 않는다. 지우기에 실패하면 false를 돌려준다. */
export function resetProgress(): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    publish({ ...snapshot, saveFailed: true });
    return false;
  }
  saveNicknameDraft('');
  publish({ progress: rules.createInitial(), saveFailed: false });
  return true;
}
