import { cards } from './cards';
import { characters } from './characters';
import { dms } from './dms';
import { readings } from './readings';
import type { Character, CharacterId, DmSet, QuoteCard, Reading } from './types';

export * from './types';
export { PLAYABLE_IDS, upcomingAuthors } from './catalog';
export { cards, REWARD_SCORE } from './cards';
export { characters } from './characters';
export { dms } from './dms';
export { exampleRanking } from './ranking';
export { readings } from './readings';

export const getCharacter = (id: CharacterId): Character =>
  characters.find((c) => c.id === id) as Character;
// 미션 순서는 dms.ts, readings.ts 안에 적힌 순서와 같다. 0이 첫 미션.
export const getDm = (id: CharacterId, missionIndex = 0): DmSet =>
  dms.filter((d) => d.characterId === id)[missionIndex];
export const getReading = (id: CharacterId, missionIndex = 0): Reading =>
  readings.filter((r) => r.characterId === id)[missionIndex];
export const getMissionCount = (id: CharacterId): number =>
  readings.filter((r) => r.characterId === id).length;
export const getCardsOf = (id: CharacterId): QuoteCard[] =>
  cards.filter((c) => c.characterId === id);
export const getCard = (id: string): QuoteCard | undefined => cards.find((c) => c.id === id);
