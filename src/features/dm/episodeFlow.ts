// 선택 대화 한 편을 고른 답에 따라 펼치는 순수 계산. 화면과 저장은 모른다.
import type { Episode, EpisodeChoice } from '../../data/fanTypes';

export interface EpisodeItem {
  who: 'them' | 'me';
  text: string;
  /** 고른 답에 대한 인물 반응의 마지막 말풍선에만: 그 답의 호감 보너스와 beat 번호 */
  gain?: { beat: number; affinity: number };
}

/** 괄호로 감싼 말풍선은 인물의 속마음이다. */
export const isInnerLine = (text: string) => text.startsWith('(') && text.endsWith(')');

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
    choice.reply.forEach((text, at) =>
      items.push({
        who: 'them',
        text: fillName(text, nickname),
        ...(at === choice.reply.length - 1 ? { gain: { beat: index, affinity: choice.affinity } } : {}),
      }),
    );
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

/**
 * 'locked' = 호감 단계가 모자라 잠김, 'waiting' = 단계는 되지만 오늘 열 수 있는 편을 다 써서 내일 도착.
 */
export type EpisodeStatus = 'new' | 'open' | 'done' | 'locked' | 'waiting';

/**
 * 목록의 각 대화 상태. 아직 안 끝낸 열린 대화 중 첫 번째가 'new'.
 * slots = 오늘 더 열 수 있는 새 대화 수(episodeSlotsLeft). 그 수를 넘는 안 끝낸 대화는 'waiting'.
 */
export function episodeStatuses(list: Episode[], finished: Record<string, unknown>, stage: number, slots = Infinity): EpisodeStatus[] {
  let given = 0;
  return list.map((episode) => {
    if (episode.id in finished) return 'done';
    if (episode.minStage > stage) return 'locked';
    if (given >= slots) return 'waiting';
    given += 1;
    return given === 1 ? 'new' : 'open';
  });
}

/** 대화 끝에서 같이 읽자고 권할 대목. 정해 둔 대목을 이미 읽었으면 그 인물의 안 읽은 대목 중 첫 번째, 다 읽었으면 없음. */
export function unreadRecommend(preferred: string | undefined, passageIds: string[], read: Record<string, unknown>): string | null {
  if (preferred && !(preferred in read) && passageIds.includes(preferred)) return preferred;
  return passageIds.find((id) => !(id in read)) ?? null;
}
