import { describe, expect, it } from 'vitest';
import type { Episode } from '../../data/fanTypes';
import { episodeStatuses, pickedAffinity, pickedIds, picksFromIds, walkEpisode } from './episodeFlow';

const episode: Episode = {
  id: 'nietzsche-ep1',
  characterId: 'nietzsche',
  title: '첫 편지',
  minStage: 0,
  preview: '미리보기',
  beats: [
    { say: ['{name}, 왔나.'] },
    {
      say: ['물어볼 게 있다.'],
      choices: [
        { id: 'a', text: '네', reply: ['좋다.'], affinity: 2 },
        { id: 'b', text: '아니요', reply: ['그래도 묻겠다.', '들어라.'], affinity: 1 },
      ],
    },
    { say: ['또 하나.'], choices: [{ id: 'c', text: '{name}입니다', reply: ['기억하지.'], affinity: 3 }] },
    { say: ['오늘은 여기까지.'] },
  ],
  recommend: 'twilight-1',
};

describe('선택 대화 펼치기', () => {
  it('고르기 전에는 선택지 앞에서 멈추고 닉네임을 넣는다', () => {
    const view = walkEpisode(episode, {}, '덕구');
    expect(view.items.map((i) => i.text)).toEqual(['덕구, 왔나.', '물어볼 게 있다.']);
    expect(view.ask?.map((c) => c.id)).toEqual(['a', 'b']);
    expect(view.askBeat).toBe(1);
    expect(view.ended).toBe(false);
  });

  it('다 고르면 마지막 beat까지 이어지고 끝난다', () => {
    const picks = { 1: 'b', 2: 'c' };
    const view = walkEpisode(episode, picks, '덕구');
    expect(view.ended).toBe(true);
    expect(view.items.filter((i) => i.who === 'me').map((i) => i.text)).toEqual(['아니요', '덕구입니다']);
    expect(view.items.at(-1)?.text).toBe('오늘은 여기까지.');
    expect(pickedIds(episode, picks)).toEqual(['b', 'c']);
    expect(pickedAffinity(episode, picks)).toBe(4);
    expect(picksFromIds(episode, ['b', 'c'])).toEqual(picks);
  });

  it('안 끝낸 열린 대화 중 첫 번째가 새 메시지, 단계가 모자라면 잠긴다', () => {
    const list = [episode, { ...episode, id: 'x2' }, { ...episode, id: 'x3', minStage: 2 }, { ...episode, id: 'x4' }];
    expect(episodeStatuses(list, { 'nietzsche-ep1': ['a'] }, 1)).toEqual(['done', 'new', 'locked', 'open']);
  });
});
