// 서고 저장 읽기. 저장 형식과 키(hipdok.library.v1)는 src/library.mjs 가 정한다.
import { COLORS, STORAGE_KEY, freshLibrary, loadLibrary } from '../../library.mjs';
import type { PersonalBook } from './libraryData';

export type BookDraft = Omit<PersonalBook, 'id' | 'createdAt' | 'updatedAt'>;
export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone:'Asia/Seoul' });
export const blankBook = ():BookDraft => ({ title:'', author:'', genre:'문학', finishedAt:today(), quote:'', memo:'', color:COLORS[0] });
/** 저장 기록이 없을 때만 입덕 닉네임을 초기값으로 쓴다. 이 함수는 저장소에 쓰지 않는다. */
export const readInitial = (seedNickname = '') => {
  try {
    const loaded = loadLibrary(localStorage);
    if (seedNickname && localStorage.getItem(STORAGE_KEY) === null) return { ...loaded, data: { ...loaded.data, nickname: seedNickname } };
    return loaded;
  } catch {
    return { data: freshLibrary(), blocked: true, error: '브라우저 저장소를 사용할 수 없어요. 저장 설정을 확인해 주세요.' };
  }
};
/** 서고에 사용자가 이미 정한 이름. 없거나 기본값이면 빈 문자열. 입덕 화면의 첫 값으로 쓴다. */
export const savedLibraryNickname = (): string => {
  try {
    if (localStorage.getItem(STORAGE_KEY) === null) return '';
    const { data, blocked } = loadLibrary(localStorage);
    return blocked || data.nickname === freshLibrary().nickname ? '' : data.nickname;
  } catch {
    return '';
  }
};
