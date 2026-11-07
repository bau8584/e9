// 내 방 담당(희경 선생님)이 쓰는 데이터 함수. 사용법은 README "내 방 연결 방법" 참고.
import { getCard, getCharacter, type Character, type QuoteCard } from '../../data';
import { getProgress, resetProgress, useSnapshot } from '../../store/store';

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

/** 모든 기록을 지우고 첫 화면으로 돌아간다. 실패하면 false. 버튼에 "정말 지울까요?" 확인을 붙일 것. */
export const resetAll = (): boolean => resetProgress();

/** 화면 안에서 쓰는 묶음. 값이 바뀌면 화면이 저절로 다시 그려진다. */
export function useMyRoomData() {
  useSnapshot();
  return {
    nickname: getNickname(),
    favorite: getFavorite(),
    cards: getCards(),
    score: getScore(),
    resetAll,
  };
}
