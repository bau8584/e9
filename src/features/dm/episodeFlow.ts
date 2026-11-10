// 선택 대화 한 편을 고른 답에 따라 펼치는 순수 계산. 화면과 저장은 모른다.
import type { Episode, EpisodeChoice } from '../../data/fanTypes';

export interface EpisodeItem {
  who: 'them' | 'me';
  text: string;
}

/** beat 번호 → 고른 답 id */
export type EpisodePicks = Record<number, string>;

export interface EpisodeView {
  /** 지금까지 오간 말풍선(다음 선택지 앞까지) */
  items: EpisodeItem[];
  /** 아직 고르지 않은 선택지. 없으면 null */
  ask: EpisodeChoice[] | null;
  /** ask가 있는 beat 번호 */
  askBeat: number;
  /** 마지막 beat까지 다 보았다 */
  ended: boolean;
}

export const fillName = (text: string, nickname: string) => text.replaceAll('{name}', nickname);

export function walkEpisode(episode: Episode, picks: EpisodePicks, nickname: string): EpisodeView {
  const items: EpisodeItem[] = [];
  for (let index = 0; index < episode.beats.length; index += 1) {
    const beat = episode.beats[index];
    beat.say.forEach((text) => items.push({ who: 'them', text: fillName(text, nickname) }));
    if (!beat.choices?.length) continue;
    const choice = beat.choices.find((c) => c.id === picks[index]);
    if (!choice) {
      return { items, ask: beat.choices.map((c) => ({ ...c, text: fillName(c.text, nickname) })), askBeat: index, ended: false };
    }
    items.push({ who: 'me', text: fillName(choice.text, nickname) });
    choice.reply.forEach((text) => items.push({ who: 'them', text: fillName(text, nickname) }));
  }
  return { items, ask: null, askBeat: -1, ended: true };
}

function pickedChoices(episode: Episode, picks: EpisodePicks): EpisodeChoice[] {
  return episode.beats.flatMap((beat, index) => beat.choices?.find((c) => c.id === picks[index]) ?? []);
}

/** completeEpisode에 넘길 고른 답 id들(대화 순서대로) */
export const pickedIds = (episode: Episode, picks: EpisodePicks): string[] => pickedChoices(episode, picks).map((c) => c.id);

/** 고른 답들의 호감 보너스 합 */
export const pickedAffinity = (episode: Episode, picks: EpisodePicks): number =>
  pickedChoices(episode, picks).reduce((sum, c) => sum + c.affinity, 0);

/** 저장된 답 id 목록을 beat 번호에 다시 맞춘다(다시 보기). */
export function picksFromIds(episode: Episode, ids: string[]): EpisodePicks {
  const picks: EpisodePicks = {};
  episode.beats.forEach((beat, index) => {
    const found = beat.choices?.find((c) => ids.includes(c.id));
    if (found) picks[index] = found.id;
  });
  return picks;
}

export type EpisodeStatus = 'new' | 'open' | 'done' | 'locked';

/** 목록의 각 대화 상태. 아직 안 끝낸 열린 대화 중 첫 번째가 'new'. */
export function episodeStatuses(list: Episode[], finished: Record<string, unknown>, stage: number): EpisodeStatus[] {
  let newGiven = false;
  return list.map((episode) => {
    if (episode.id in finished) return 'done';
    if (episode.minStage > stage) return 'locked';
    if (!newGiven) {
      newGiven = true;
      return 'new';
    }
    return 'open';
  });
}
