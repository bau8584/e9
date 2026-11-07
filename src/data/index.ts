import { cards } from './cards';
import { characters } from './characters';
import { dms } from './dms';
import { readings } from './readings';
import type { Character, CharacterId, DmSet, QuoteCard, Reading } from './types';

export * from './types';
export { cards, RARE_CHANCE, REWARD_SCORE } from './cards';
export { characters } from './characters';
export { dms } from './dms';
export { exampleRanking } from './ranking';
export { readings } from './readings';

export const getCharacter = (id: CharacterId): Character =>
  characters.find((c) => c.id === id) as Character;
export const getDm = (id: CharacterId): DmSet => dms.find((d) => d.characterId === id) as DmSet;
export const getReading = (id: CharacterId): Reading =>
  readings.find((r) => r.characterId === id) as Reading;
export const getCardsOf = (id: CharacterId): QuoteCard[] =>
  cards.filter((c) => c.characterId === id);
export const getCard = (id: string): QuoteCard | undefined => cards.find((c) => c.id === id);
