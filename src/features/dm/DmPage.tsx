import { NietzscheCards } from '../home/NietzscheCards';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterSwitcher } from '../../components/CharacterSwitcher';
import { AdaptedLabel } from '../../components/Labels';
import { Portrait } from '../../components/Portrait';
import { getCharacter, getDm } from '../../data';
import { bonds } from '../../data/bonds';
import { useBond } from '../../store/bond';
import { chooseReply, goTo, markDmRead, useSnapshot } from '../../store/store';
import { AI_CHARACTERS, AiChat, aiChatAvailable } from './AiChat';
import { prefersReducedMotion, useMessageReveal } from './useMessageReveal';
import './dm.css';

const NO_TEXTS: string[] = [];

export function DmPage() {
  const { progress } = useSnapshot();
  // 효과는 화면을 그린 뒤에 돈다. 새 작가 대화의 첫 재생 판단(playArrival)은 그리는 도중에 끝나므로 연출이 유지된다.
  useEffect(markDmRead, [progress.favoriteId, progress.missionIndex]);
  if (!progress.favoriteId) return null;
  return (
    <>
      <div className="dm-switcher">
        <CharacterSwitcher />
      </div>
      <DmConversation key={`${progress.favoriteId}:${progress.missionIndex}`} />
    </>
  );
}

function DmConversation() {
  const { progress } = useSnapshot();
  const character = getCharacter(progress.favoriteId!);
  const dm = getDm(character.id, progress.missionIndex);
  const chosen = dm.replies.find((r) => r.id === progress.dmChoiceId);
  const bondStage = useBond().stage;
  // 가까워질수록 최애가 먼저 건네는 말이 대화 맨 앞에 붙는다. 대화를 열어 둔 동안 순서가 바뀌지 않게 고정한다.
  const opener = bonds[character.id][bondStage].opener?.replaceAll('{name}', progress.nickname);
  const messages = useMemo(() => (opener ? [opener, ...dm.messages] : dm.messages), [opener, dm.messages]);

  // 처음 받는 DM과 이 화면에서 방금 누른 답장만 재생한다. 다시 볼 때는 바로 다 보인다.
  const [playArrival] = useState(() => !progress.dmRead && !progress.dmChoiceId && !prefersReducedMotion());
  const [playedReplyId, setPlayedReplyId] = useState<string | null>(null);
  const arrival = useMessageReveal(messages, playArrival, 'arrive');
  const playAnswer = Boolean(chosen) && chosen?.id === playedReplyId;
  const answer = useMessageReveal(chosen?.answer ?? NO_TEXTS, playAnswer, 'answer');

  const done = arrival.done && answer.done;
  const phase = arrival.done ? answer.phase : arrival.phase;
  const visible = arrival.visibleCount + answer.visibleCount;

  const endRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const focusAfterSkip = useRef(false);

  useEffect(() => {
    if (!done) endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [done, phase, visible, chosen]);

  useEffect(() => {
    if (done && focusAfterSkip.current) {
      focusAfterSkip.current = false;
      actionsRef.current?.querySelector('button')?.focus();
    }
  }, [done]);

  const skip = () => {
    arrival.skip();
    answer.skip();
  };

  const choose = (replyId: string) => {
    if (!prefersReducedMotion()) setPlayedReplyId(replyId);
    chooseReply(replyId);
  };

  return (
    <div className="page dm">
      <header className="dm-stage">
        <Portrait character={character} className="dm-portrait" stage={bondStage} />
        <div className="dm-who">
          <h1 className="dm-name">{character.name}</h1>
          <p className="dm-relation">{bonds[character.id][bondStage].title}</p>
          <AdaptedLabel />
          {phase !== 'idle' && (
            <span className="dm-presence" aria-hidden="true">
              {phase === 'typing' ? '입력 중' : '접속 중'}
            </span>
          )}
        </div>
      </header>
      <div className="dm-talk">
      <div className="dm-thread" aria-live="polite" onClick={done ? undefined : skip}>
        {messages.slice(0, arrival.visibleCount).map((text) => (
          <p key={text} className={playArrival ? 'bubble bubble-them bubble-in' : 'bubble bubble-them'}>
            {text}
          </p>
        ))}
        {chosen && (
          <>
            <p className={playAnswer ? 'bubble bubble-me bubble-in' : 'bubble bubble-me'}>{chosen.text}</p>
            {chosen.answer.slice(0, answer.visibleCount).map((text) => (
              <p key={text} className={playAnswer ? 'bubble bubble-them bubble-in' : 'bubble bubble-them'}>
                {text}
              </p>
            ))}
          </>
        )}
        {phase === 'typing' && (
          <div className="bubble bubble-them bubble-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>
      {done && chosen && character.id === 'nietzsche' && <NietzscheCards />}
      {!done ? (
        <button
          type="button"
          className="dm-skip"
          onClick={() => {
            focusAfterSkip.current = true;
            skip();
          }}
        >
          바로 보기
        </button>
      ) : chosen ? (
        <div ref={actionsRef} className="dm-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('reading')}>
            {progress.stage === 'done' ? '내가 얻은 카드 보기' : progress.stage === 'draw' ? '카드 뽑으러 가기' : dm.readButton}
          </button>
        </div>
      ) : (
        <div ref={actionsRef} className={playArrival ? 'dm-replies dm-actions' : 'dm-replies'}>
          <p className="dm-replies-label">답장 고르기</p>
          {dm.replies.map((reply) => (
            <button key={reply.id} type="button" className="btn btn-reply" onClick={() => choose(reply.id)}>
              {reply.text}
            </button>
          ))}
        </div>
      )}
      {done && aiChatAvailable() && AI_CHARACTERS.includes(character.id) && (
        <AiChat
          characterId={character.id}
          name={character.name}
          stage={bondStage}
          context={[...messages.map((m) => `${character.name}: ${m}`), ...(chosen ? [`사용자: ${chosen.text}`, ...chosen.answer.map((m) => `${character.name}: ${m}`)] : [])].join('\n')}
        />
      )}
      </div>
    </div>
  );
}
