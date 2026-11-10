// 선택 대화. 인물마다 파일 하나.
import type { Episode } from '../fanTypes';
import type { CharacterId } from '../types';
import { episodes as nietzsche } from './nietzsche';
import { episodes as xunzi } from './xunzi';

export const episodes: Episode[] = [...nietzsche, ...xunzi];
export const episodesOf = (id: CharacterId): Episode[] => episodes.filter((e) => e.characterId === id);
export const getEpisode = (id: string): Episode | undefined => episodes.find((e) => e.id === id);
