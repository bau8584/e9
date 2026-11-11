import { useEffect, useMemo, useRef, useState } from 'react';
import { booksOf, getPassage } from '../../data/books';
import type { Episode } from '../../data/fanTypes';
import type { CharacterId } from '../../data/types';
import { EPISODE_AFFINITY, completeEpisode, getFan, useFan } from '../../store/fan';
import { openPassage } from '../reading/nav';
import { DM_COPY } from './dmCopy';
import type { EpisodeSession, Reward } from './dmSession';
import { isInnerLine, pickedAffinity, pickedIds, unreadRecommend, walkEpisode } from './episodeFlow';
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
  const fan = useFan();
  /** 이 화면에서 방금 고른 beat들. 그 답에만 "마음 +N"을 붙인다(다시 보기에는 안 붙는다). */
  const [justPicked, setJustPicked] = useState<number[]>([]);
  /** 이 화면에서 방금 끝내 보상을 받았다. 팩을 그 자리에서 연다. */
  const [justFinished, setJustFinished] = useState(false);

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
      const reward: Reward = { first, affinity: EPISODE_AFFINITY + bonus, ticket: true, ticketFull: getFan().chatTickets === before, pack: true };
      finished = reward;
      if (first) setJustFinished(true);
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
    setJustPicked((beats) => [...beats, view.askBeat]);
    onChange({ ...session, seen: view.items.length, picks: { ...session.picks, [view.askBeat]: choiceId } });
  };

  const replay = () => {
    completed.current = false;
    setJustPicked([]);
    setJustFinished(false);
    onChange({ id: episode.id, picks: {}, seen: 0, finished: null });
  };

  let themShown = 0;
  // 아직 안 읽은 대목만 권한다. 다 읽었으면 단추를 숨긴다.
  const passageIds = useMemo(() => booksOf(characterId).flatMap((book) => book.passages.map((p) => p.id)), [characterId]);
  const recommendId = unreadRecommend(episode.recommend, passageIds, fan.passages);
  const recommend = recommendId ? getPassage(recommendId) : undefined;
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
          const inner = item.who === 'them' && isInnerLine(item.text);
          const cls = `bubble ${item.who === 'me' ? 'bubble-me' : 'bubble-them'}${inner ? ' bubble-inner' : ''}${fresh && motion ? ' bubble-in' : ''}`;
          const bubble = (
            <p key={index} className={cls}>
              {inner && <span className="dm-sr">속마음: </span>}
              {item.text}
            </p>
          );
          if (!item.gain || !justPicked.includes(item.gain.beat)) return bubble;
          const { affinity } = item.gain;
          return (
            <div key={index} className="dm-gain-row">
              {bubble}
              <span className={`dm-gain${affinity >= 3 ? ' is-big' : affinity === 0 ? ' is-flat' : ''}${motion ? ' is-pop' : ''}`}>
                {DM_COPY.gain(affinity)}
              </span>
            </div>
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
          {session.finished?.first && <RewardNotice reward={session.finished} characterId={characterId} fresh={justFinished} />}
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
