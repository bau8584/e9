// 내 방 담당이 쓰는 데이터 함수. 입덕 쪽 기록은 여기로만 읽는다.
import { getCard, getCharacter, type Character, type QuoteCard } from '../../data';
import { cleanNickname, isSeasonComplete, NICKNAME_MAX, type Screen, type Stage } from '../../store/progress';
import { getProgress, goTo, renameNickname, resetProgress, useSnapshot } from '../../store/store';

export { cleanNickname, NICKNAME_MAX, renameNickname };

export const getNickname = (): string => getProgress().nickname;

export function getFavorite(): Character | null {
  const id = getProgress().favoriteId;
  return id ? getCharacter(id) : null;
}

export const getCards = (): QuoteCard[] =>
  getProgress().cards.flatMap((id) => {
    const card = getCard(id);
    return card ? [card] : [];
  });

export const getScore = (): number => getProgress().score;

/** 입덕 진행 기록을 지우고 첫 화면으로 돌아간다. 서고는 남는다. 실패하면 false. 버튼에 "정말 지울까요?" 확인을 붙일 것. */
export const resetAll = (): boolean => resetProgress();

export interface CardGroup {
  character: Character;
  isFavorite: boolean;
  cards: QuoteCard[];
}

/** 카드를 인물별로 묶는다. 최애가 맨 앞, 나머지는 뽑은 순서. 인물당 장수는 정해 두지 않는다. */
export function groupCards(cards: QuoteCard[], favoriteId: string | null): CardGroup[] {
  const groups = new Map<string, CardGroup>();
  for (const card of cards) {
    const group = groups.get(card.characterId);
    if (group) group.cards.push(card);
    else
      groups.set(card.characterId, {
        character: getCharacter(card.characterId),
        isFavorite: card.characterId === favoriteId,
        cards: [card],
      });
  }
  return [...groups.values()].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
}

/** 검수 완료 표시(reviewed: true)가 카드에 없으면 전부 검수 전으로 본다. */
export const needsReview = (card: QuoteCard): boolean => (card as QuoteCard & { reviewed?: boolean }).reviewed !== true;

/** 복사할 글. 검수 전 카드는 복사한 글에도 그 사실을 남긴다. */
export function cardShareText(card: QuoteCard): string {
  const lines = [`"${card.quote}"`, `${getCharacter(card.characterId).name}, ${card.source}`];
  lines.push(needsReview(card) ? '제작진 임시 번역 (검수 필요)' : '제작진 번역');
  return lines.join('\n');
}

const MISSION_SCREEN: Record<Stage, Screen> = { dm: 'dm', reading: 'reading', draw: 'reading', done: 'home' };

export const isSeasonDone = (): boolean => isSeasonComplete(getProgress());

/** 지금 단계에 맞는 미션 화면으로 간다. */
export const goToMission = () => goTo(MISSION_SCREEN[getProgress().stage]);

/** 홈과 서고에 다른 이름이 저장돼 있으면 true. 어느 쪽도 고치지 않는다. */
export const namesDiffer = (homeName: string, libraryName: string): boolean =>
  Boolean(homeName) && homeName !== libraryName;

/** 화면 안에서 쓰는 묶음. 값이 바뀌면 화면이 저절로 다시 그려진다. */
export function useMyRoomData() {
  useSnapshot();
  return {
    nickname: getNickname(),
    favorite: getFavorite(),
    cards: getCards(),
    score: getScore(),
    groups: groupCards(getCards(), getProgress().favoriteId),
    resetAll,
  };
}
