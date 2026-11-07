// firestore.rules 시나리오. `npm run test:rules` (Java 11 이상과 에뮬레이터 필요). 실제 DB에는 닿지 않는다.
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, runTransaction, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let env: RulesTestEnvironment;
const db = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const anon = () => env.unauthenticatedContext().firestore() as unknown as Firestore;

const progress = { nickname: '덕구', favoriteId: 'nietzsche', missionIndex: 0, stage: 'dm', dmRead: false, dmChoiceId: null, lastWrongOptionId: null, cards: [], score: 0, rewardedMissions: [] };
const library = { version: 1, nickname: '덕구', books: [] };
const userDoc = { progress, progressUpdatedAt: 1, library, libraryUpdatedAt: 1 };

const seedFandom = (score = 100) =>
  env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore() as unknown as Firestore, 'fandoms/nietzsche'), { score }); });

/** 앱이 하는 것과 같은 묶음 쓰기 */
const claim = (d: Firestore, uid: string, missionId = 'reading-nietzsche-1', character = 'nietzsche', add = 20, extra: object = {}) =>
  runTransaction(d, async (tx) => {
    const fandomRef = doc(d, 'fandoms', character);
    const score = (await tx.get(fandomRef)).data()!.score as number;
    tx.set(doc(d, 'users', uid, 'claims', missionId), { characterId: character, missionId, createdAt: serverTimestamp() });
    tx.set(fandomRef, { score: score + add, lastMissionId: missionId, ...extra });
  });

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-hipdok', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 5230 } });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('users', () => {
  it('본인 문서는 읽고 쓴다', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'users/a'), userDoc));
    await assertSucceeds(getDoc(doc(db('a'), 'users/a')));
  });
  it('타인 문서는 읽기, 쓰기 모두 거부', async () => {
    await setDoc(doc(db('a'), 'users/a'), userDoc);
    await assertFails(getDoc(doc(db('b'), 'users/a')));
    await assertFails(setDoc(doc(db('b'), 'users/a'), userDoc));
  });
  it('비로그인은 거부', async () => {
    await assertFails(getDoc(doc(anon(), 'users/a')));
    await assertFails(setDoc(doc(anon(), 'users/a'), userDoc));
  });
  it('users 목록 조회는 거부', async () => {
    await setDoc(doc(db('a'), 'users/a'), userDoc);
    await assertFails(getDocs(collection(db('a'), 'users')));
  });
  it('내 문서 전체 삭제는 허용, 타인 문서 삭제와 한쪽 칸만 삭제는 거부', async () => {
    await setDoc(doc(db('a'), 'users/a'), userDoc);
    await assertFails(deleteDoc(doc(db('b'), 'users/a')));
    await assertFails(updateDoc(doc(db('a'), 'users/a'), { progressUpdatedAt: deleteField() }));
    await assertSucceeds(deleteDoc(doc(db('a'), 'users/a')));
  });
  it('내 문서를 지워도 claim은 남아 같은 미션을 다시 받지 못한다', async () => {
    await seedFandom();
    await setDoc(doc(db('a'), 'users/a'), userDoc);
    await claim(db('a'), 'a');
    await deleteDoc(doc(db('a'), 'users/a'));
    await assertFails(claim(db('a'), 'a'));
  });
  it('최종 카드, 미션 id만 허용하고 8개 넘으면 거부', async () => {
    const d = doc(db('a'), 'users/a');
    const allCards = readFileSync('src/data/cards.ts', 'utf8').match(/id: '(card-[^']+)'/g)!.map((m) => m.slice(5, -1));
    expect(allCards).toHaveLength(8);
    await assertSucceeds(setDoc(d, { ...userDoc, progress: { ...progress, cards: allCards } }));
    await assertFails(setDoc(d, { ...userDoc, progress: { ...progress, cards: ['card-old'] } }));
    await assertFails(setDoc(d, { ...userDoc, progress: { ...progress, cards: new Array(9).fill(allCards[0]) } }));
    await assertFails(setDoc(d, { ...userDoc, progress: { ...progress, rewardedMissions: ['reading-nietzsche-3'] } }));
    await assertSucceeds(setDoc(d, { ...userDoc, progress: { ...progress, rewardedMissions: ['reading-nietzsche-2'] } }));
  });
  it('서버에 옛 카드 id가 남아 있어도 서고 동기화는 막히지 않고, 진행을 새로 올리면 깨끗한 값만 허용', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, 'users/a'), { ...userDoc, progress: { ...progress, cards: ['card-old'] } });
    });
    const d = doc(db('a'), 'users/a');
    await assertSucceeds(setDoc(d, { library: { ...library, nickname: '새이름' }, libraryUpdatedAt: 5 }, { merge: true }));
    await assertFails(setDoc(d, { progress: { ...progress, cards: ['card-old'] }, progressUpdatedAt: 6 }, { merge: true }));
    await assertSucceeds(setDoc(d, { progress, progressUpdatedAt: 6 }, { merge: true }));
  });
  it('시계가 며칠 빠른 기기는 허용, 상한을 넘거나 음수면 거부', async () => {
    const d = doc(db('a'), 'users/a');
    await assertSucceeds(setDoc(d, { progress, progressUpdatedAt: Date.now() + 30 * 86400000 }));
    await assertSucceeds(setDoc(d, { progress, progressUpdatedAt: 4102444800000 }));
    await assertFails(setDoc(d, { progress, progressUpdatedAt: 4102444800001 }));
    await assertFails(setDoc(d, { progress, progressUpdatedAt: -1 }));
    await assertFails(setDoc(d, { progressUpdatedAt: 5 }));
  });
  it('닉네임 21자, 모르는 칸, 잘못된 최애는 거부하고 20자는 허용', async () => {
    const d = doc(db('a'), 'users/a');
    await assertSucceeds(setDoc(d, { ...userDoc, progress: { ...progress, nickname: '가'.repeat(20) } }));
    await assertFails(setDoc(d, { ...userDoc, progress: { ...progress, nickname: '가'.repeat(21) } }));
    await assertFails(setDoc(d, { ...userDoc, secret: 1 }));
    await assertFails(setDoc(d, { ...userDoc, progress: { ...progress, favoriteId: 'hacker' } }));
    await assertFails(setDoc(d, { ...userDoc, library: { ...library, nickname: '가'.repeat(31) } }));
    await assertFails(setDoc(d, { ...userDoc, library: { ...library, books: new Array(201).fill({}) } }));
  });
  it('초기화한 빈 진행 기록도 올릴 수 있다', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'users/a'), { progress: { ...progress, nickname: '', favoriteId: null }, progressUpdatedAt: 2 }));
  });
});

describe('fandoms', () => {
  it('누구나 읽는다(목록 포함)', async () => {
    await seedFandom();
    await assertSucceeds(getDoc(doc(anon(), 'fandoms/nietzsche')));
    await assertSucceeds(getDocs(collection(anon(), 'fandoms')));
  });
  it('없는 팬덤은 0으로만 만들 수 있고, 비로그인과 모르는 인물은 거부', async () => {
    await assertFails(setDoc(doc(db('a'), 'fandoms/nietzsche'), { score: 20 }));
    await assertFails(setDoc(doc(anon(), 'fandoms/nietzsche'), { score: 0 }));
    await assertFails(setDoc(doc(db('a'), 'fandoms/hacker'), { score: 0 }));
    await assertFails(setDoc(doc(db('a'), 'fandoms/nietzsche'), { score: 0, x: 1 }));
    await assertSucceeds(setDoc(doc(db('a'), 'fandoms/nietzsche'), { score: 0 }));
  });
  it('이미 있으면 0으로 되돌리지 못한다', async () => {
    await seedFandom();
    await assertFails(setDoc(doc(db('a'), 'fandoms/nietzsche'), { score: 0 }));
  });
  it('claim 없이 점수만 올리면 거부', async () => {
    await seedFandom();
    await assertFails(updateDoc(doc(db('a'), 'fandoms/nietzsche'), { score: 120, lastMissionId: 'reading-nietzsche-1' }));
  });
  it('삭제는 거부', async () => {
    await seedFandom();
    await assertFails(deleteDoc(doc(db('a'), 'fandoms/nietzsche')));
  });
});

describe('미션 보상', () => {
  beforeEach(() => seedFandom());
  it('claim 생성과 +20을 함께 하면 허용', async () => {
    await assertSucceeds(claim(db('a'), 'a'));
  });
  it.each([[19], [21], [40], [0], [-20]])('%i점은 거부', async (add) => {
    await assertFails(claim(db('a'), 'a', 'reading-nietzsche-1', 'nietzsche', add));
  });
  it('같은 미션 2회는 거부', async () => {
    await assertSucceeds(claim(db('a'), 'a'));
    await assertFails(claim(db('a'), 'a'));
  });
  it('다른 사람은 같은 미션을 받을 수 있지만 남의 claim은 못 만든다', async () => {
    await assertSucceeds(claim(db('a'), 'a'));
    await assertSucceeds(claim(db('b'), 'b'));
    await assertFails(claim(db('c'), 'a', 'reading-nietzsche-2'));
  });
  it('claim 혼자 만들면 거부', async () => {
    await assertFails(setDoc(doc(db('a'), 'users/a/claims/reading-nietzsche-1'), { characterId: 'nietzsche', missionId: 'reading-nietzsche-1', createdAt: serverTimestamp() }));
  });
  it('형식이 틀린 미션, 다른 인물의 미션, 없는 미션 번호는 거부', async () => {
    await assertFails(claim(db('a'), 'a', 'hack'));
    await assertFails(claim(db('a'), 'a', 'reading-austen-1'));
    await assertFails(claim(db('a'), 'a', 'reading-nietzsche-3'));
  });
  it('점수 올리며 다른 칸을 더하면 거부', async () => {
    await assertFails(claim(db('a'), 'a', 'reading-nietzsche-1', 'nietzsche', 20, { nickname: '덕구' }));
  });
  it('claim은 고치거나 지울 수 없다', async () => {
    await claim(db('a'), 'a');
    const d = doc(db('a'), 'users/a/claims/reading-nietzsche-1');
    await assertFails(deleteDoc(d));
    await assertFails(updateDoc(d, { characterId: 'austen' }));
  });
});

describe('기본 거부', () => {
  it('임의 컬렉션은 로그인해도 거부', async () => {
    await assertFails(setDoc(doc(db('a'), 'anything/x'), { a: 1 }));
    await assertFails(getDoc(doc(db('a'), 'anything/x')));
    await assertFails(setDoc(doc(db('a'), 'users/a/other/x'), { a: 1 }));
  });
});
