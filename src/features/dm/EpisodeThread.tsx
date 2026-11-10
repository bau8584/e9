import { useEffect, useMemo, useRef, useState } from 'react';
import { getPassage } from '../../data/books';
import type { Episode } from '../../data/fanTypes';
import type { CharacterId } from '../../data/types';
import { EPISODE_AFFINITY, completeEpisode, getFan } from '../../store/fan';
import { openPassage } from '../reading/nav';
import { DM_COPY } from './dmCopy';
import type { EpisodeSession, Reward } from './dmSession';
import { pickedAffinity, pickedIds, walkEpisode } from './episodeFlow';
import type { RevealPhase } from './messageReveal';
import { RewardNotice } from './RewardNotice';
import { prefersReducedMotion, useMessageReveal } from './useMessageReveal';

interface Props {
  episode: Episode;
  session: EpisodeSession;
  characterId: CharacterId;
  nickname: string;
  onChange: (next: EpisodeSession) => void;
  onBack: () => void;
  onPhase: (phase: RevealPhase) => void;
}

/** 선택 대화 한 편. beat 순서대로 말풍선이 도착하고, 고르면 인물의 답이 이어진다. */
export function EpisodeThread({ episode, session, characterId, nickname, onChange, onBack, onPhase }: Props) {
  const view = useMemo(() => walkEpisode(episode, session.picks, nickname), [episode, session.picks, nickname]);
  const seen = Math.min(session.seen, view.items.length);
  const tail = useMemo(() => view.items.slice(seen), [view, seen]);
  const tailThem = useMemo(() => tail.filter((item) => item.who === 'them').map((item) => item.text), [tail]);
  const [motion] = useState(() => !prefersReducedMotion());
  const reveal = useMessageReveal(tailThem, motion, tail[0]?.who === 'me' ? 'answer' : 'arrive');
  const completed = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const focusAfterSkip = useRef(false);

  useEffect(() => onPhase(reveal.phase), [reveal.phase, onPhase]);
  useEffect(() => () => onPhase('idle'), [onPhase]);

  // 연출이 끝나면 본 데까지 적어 두고, 마지막 beat까지 보았으면 한 번만 끝낸 것으로 남긴다.
  useEffect(() => {
    if (!reveal.done) return;
    const needsFinish = view.ended && !session.finished;
    if (seen >= view.items.length && !needsFinish) return;
    // 이미 끝낸 것으로 남겼고 화면 반영을 기다리는 중이면 다시 쓰지 않는다(개발 모드의 효과 두 번 실행 포함).
    if (needsFinish && completed.current) return;
    let finished = session.finished;
    if (needsFinish) {
      completed.current = true;
      const before = getFan().chatTickets;
      const bonus = pickedAffinity(episode, session.picks);
      const first = completeEpisode(characterId, episode.id, pickedIds(episode, session.picks), bonus);
      const reward: Reward = { first, affinity: EPISODE_AFFINITY + bonus, ticket: true, ticketFull: getFan().chatTickets === before };
      finished = reward;
    }
    onChange({ ...session, seen: view.items.length, finished });
  }, [reveal.done, view, seen, session, episode, characterId, onChange]);

  useEffect(() => {
    if (!reveal.done) endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [reveal.done, reveal.phase, reveal.visibleCount, tail]);

  useEffect(() => {
    if (reveal.done && focusAfterSkip.current) {
      focusAfterSkip.current = false;
      actionsRef.current?.querySelector('button')?.focus();
    }
  }, [reveal.done]);

  const choose = (choiceId: string) => {
    onChange({ ...session, seen: view.items.length, picks: { ...session.picks, [view.askBeat]: choiceId } });
  };

  const replay = () => {
    completed.current = false;
    onChange({ id: episode.id, picks: {}, seen: 0, finished: null });
  };

  let themShown = 0;
  const recommend = episode.recommend ? getPassage(episode.recommend) : undefined;
  const ended = reveal.done && view.ended;

  return (
    <section className="dm-episode" aria-label={episode.title}>
      <div className="dm-episode-head">
        <button type="button" className="dm-back" onClick={onBack}>
          {DM_COPY.backToList}
        </button>
        <p className="dm-episode-title">{episode.title}</p>
      </div>
      <div className="dm-thread" aria-live="polite" onClick={reveal.done ? undefined : reveal.skip}>
        {view.items.map((item, index) => {
          const fresh = index >= seen;
          if (fresh && item.who === 'them') {
            themShown += 1;
            if (themShown > reveal.visibleCount) return null;
          }
          const cls = `bubble ${item.who === 'me' ? 'bubble-me' : 'bubble-them'}${fresh && motion ? ' bubble-in' : ''}`;
          return (
            <p key={index} className={cls}>
              {item.text}
            </p>
          );
        })}
        {reveal.phase === 'typing' && (
          <div className="bubble bubble-them bubble-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!reveal.done ? (
        <button
          type="button"
          className="dm-skip"
          onClick={() => {
            focusAfterSkip.current = true;
            reveal.skip();
          }}
        >
          {DM_COPY.skip}
        </button>
      ) : view.ask ? (
        <div ref={actionsRef} className="dm-replies dm-actions">
          <p className="dm-replies-label">{DM_COPY.replyLabel}</p>
          {view.ask.map((choice) => (
            <button key={choice.id} type="button" className="btn btn-reply" onClick={() => choose(choice.id)}>
              {choice.text}
            </button>
          ))}
        </div>
      ) : ended ? (
        <div ref={actionsRef} className="dm-episode-end dm-actions">
          {session.finished?.first && <RewardNotice reward={session.finished} characterId={characterId} />}
          {recommend && (
            <button type="button" className="btn btn-primary btn-block" onClick={() => openPassage(recommend.id)}>
              {DM_COPY.readRecommend(recommend.title)}
            </button>
          )}
          <div className="dm-episode-more">
            <button type="button" className="btn btn-reply" onClick={replay}>
              {DM_COPY.replayDifferent}
            </button>
            <button type="button" className="btn btn-reply" onClick={onBack}>
              {DM_COPY.backToList}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
