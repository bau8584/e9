import { useEffect, useRef, useState, type FormEvent } from 'react';
import { bonds } from '../../data/bonds';
import { getBook, getPassage } from '../../data/books';
import type { CharacterId } from '../../data/types';
import { CHAT_AFFINITY, CHAT_TURNS_BY_STAGE, TICKET_CAP, finishFreeChat, getFan, setTalkTopic, startFreeChat, useFan } from '../../store/fan';
import { goTo } from '../../store/store';
import { DM_COPY, MEMORY_CHARS, MEMORY_LINES } from './dmCopy';
import { readChatSession, writeChatSession, type ChatTurn, type FreeChatSession } from './dmSession';
import { fillName } from './episodeFlow';
import { RewardNotice } from './RewardNotice';
import './ai-chat.css';

// "대화 시간": 벌어서 쓰는 자유대화(AI). 대목을 읽거나 선택 대화 한 편을 끝내면 1회 생긴다.
// 대화 시간은 첫 말에 인물의 답이 온 뒤에 쓴다. 열기만 하고 나가거나 서버에 닿지 못하면 줄지 않는다.
// 진행 중인 대화는 이 탭에만 둔다(sessionStorage). 서버 약속: POST {character, stage, context, messages} → {bubbles, note}.
// 개발 화면은 내 컴퓨터의 시험 서버로, 공개 사이트는 미니 PC의 AI 서버로 보낸다.
// 파일로 연 힙독.html 은 서버에 닿지 못하므로 이 칸을 보이지 않는다.
export const AI_CHARACTERS: string[] = ['xunzi', 'nietzsche'];
const CHAT_URL = import.meta.env.DEV ? '/api/chat' : 'https://hipdok.deokgu.com/chat';
export const aiChatAvailable = () => window.location.protocol !== 'file:';

interface Props {
  characterId: CharacterId;
  name: string;
  nickname: string;
  stage: number;
  /** 대화 시간이 없을 때 "대화 한 편 나누기" */
  onOpenEpisode: () => void;
  onTyping: (typing: boolean) => void;
}

/** 지금 최애의 대목이면 화제로 쓴다. */
function topicOf(passageId: string | null, characterId: CharacterId) {
  const passage = passageId ? getPassage(passageId) : undefined;
  const book = passage ? getBook(passage.bookId) : undefined;
  return passage && book?.characterId === characterId ? { passage, book } : null;
}

export function AiChat({ characterId, name, nickname, stage, onOpenEpisode, onTyping }: Props) {
  const fan = useFan();
  const [session, setSessionState] = useState<FreeChatSession | null>(() => readChatSession(characterId));
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const setSession = (next: FreeChatSession | null) => {
    setSessionState(next);
    writeChatSession(characterId, next);
  };

  const topic = topicOf(fan.talkTopic, characterId);
  const memories = fan.memories[characterId] ?? [];
  const limit = CHAT_TURNS_BY_STAGE[Math.min(stage, CHAT_TURNS_BY_STAGE.length - 1)];
  const sent = session?.turns.filter((t) => t.role === 'user').length ?? 0;
  const left = Math.max(0, limit - sent);

  useEffect(() => onTyping(sending), [sending, onTyping]);
  useEffect(() => {
    if (session) endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [session, sending]);

  const open = () => {
    const intro: string[] = [];
    if (topic) intro.push(fillName(topic.passage.talkPrompt, nickname));
    const memory = memories[memories.length - 1];
    if (memory) intro.push(MEMORY_LINES[characterId].replace('{memory}', memory));
    const opener = bonds[characterId]?.[stage]?.opener;
    if (!intro.length && opener) intro.push(fillName(opener, nickname));
    setError('');
    setSession({ started: false, intro, topicId: topic ? topic.passage.id : null, turns: [], finished: null });
  };

  const contextOf = (current: FreeChatSession): string => {
    const lines = [`닉네임: ${nickname}`];
    const chosenTopic = topicOf(current.topicId, characterId);
    if (chosenTopic) {
      const { passage, book } = chosenTopic;
      lines.push(`이번 화제: 사용자가 방금 『${book.title}』의 '${passage.title}' 대목(${passage.source})을 읽고 왔다.`);
      const picked = passage.question.options.find((o) => o.id === getFan().passages[passage.id]);
      if (picked) lines.push(`대목 끝 질문 "${passage.question.prompt}"에 사용자가 고른 답: ${picked.text}`);
    }
    const remembered = getFan().memories[characterId] ?? [];
    if (remembered.length) lines.push(`지난 대화에서 사용자가 한 말: ${remembered.join(' / ')}`);
    current.intro.forEach((line) => lines.push(`${name}: ${line}`));
    return lines.join('\n');
  };

  const finish = (current: FreeChatSession) => {
    if (!current.started) {
      setSession(null);
      return;
    }
    const first = current.turns.find((t) => t.role === 'user')?.content ?? '';
    finishFreeChat(characterId, first.trim().slice(0, MEMORY_CHARS));
    setSession({ ...current, finished: { first: true, affinity: CHAT_AFFINITY, ticket: false, ticketFull: false } });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!session || session.finished || !content || sending || left <= 0) return;
    if (!session.started && getFan().chatTickets <= 0) {
      setError(DM_COPY.noTicketError);
      return;
    }
    const before = session;
    const history: ChatTurn[] = [...session.turns, { role: 'user', content }];
    setSession({ ...session, turns: history });
    setText('');
    setSending(true);
    setError('');
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          character: characterId,
          stage,
          context: contextOf(session),
          messages: history.map(({ role, content: c }) => ({ role, content: c })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.bubbles)) throw new Error('chat failed');
      // 답이 온 뒤에야 대화 시간을 쓴다. 그 사이 다른 탭에서 다 썼으면 이 말은 없던 것으로 한다.
      if (!session.started && !startFreeChat()) {
        setSession(before);
        setText(content);
        setError(DM_COPY.noTicketError);
        return;
      }
      if (!session.started && session.topicId && getFan().talkTopic === session.topicId) setTalkTopic(null);
      const bubbles: string[] = data.bubbles;
      const next: FreeChatSession = {
        ...session,
        started: true,
        turns: [
          ...history,
          ...bubbles.map((b, i): ChatTurn => ({ role: 'assistant', content: b, note: i === bubbles.length - 1 ? data.note : '' })),
        ],
      };
      if (sent + 1 >= limit) finish(next);
      else setSession(next);
    } catch {
      // 닿지 못한 말은 대화 시간과 남은 말 수에서 빠지지 않는다.
      setSession(before);
      setText(content);
      setError(DM_COPY.serverError);
    } finally {
      setSending(false);
    }
  };

  const first = Boolean(session) || Boolean(topic);

  return (
    <section className={first ? 'dm-time is-first' : 'dm-time'} aria-label={DM_COPY.timeTitle}>
      <div className="dm-time-head">
        <h2 className="section-title">{DM_COPY.timeTitle}</h2>
        <span className="dm-time-pips" aria-label={`남은 대화 시간 ${fan.chatTickets}`}>
          {Array.from({ length: TICKET_CAP }, (_, i) => (
            <span key={i} className={i < fan.chatTickets ? 'is-on' : ''} />
          ))}
        </span>
      </div>

      {!session && (
        <>
          {topic && (
            <div className="dm-topic">
              <p className="dm-topic-label">{DM_COPY.topicLabel(topic.passage.title)}</p>
              <p className="bubble bubble-them">{fillName(topic.passage.talkPrompt, nickname)}</p>
            </div>
          )}
          {fan.chatTickets > 0 ? (
            <>
              <p className="dm-time-line">{DM_COPY.timeReady(name, fan.chatTickets)}</p>
              <button type="button" className="btn btn-primary btn-block" onClick={open}>
                {DM_COPY.start}
              </button>
            </>
          ) : (
            <>
              <p className="dm-time-line">{DM_COPY.timeEmpty}</p>
              <div className="dm-time-go">
                <button type="button" className="btn btn-reply" onClick={() => goTo('reading')}>
                  {DM_COPY.goReading}
                </button>
                <button type="button" className="btn btn-reply" onClick={onOpenEpisode}>
                  {DM_COPY.goEpisode}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {session && (
        <>
          <p className="ai-chat-notice">{DM_COPY.notice}</p>
          <div className="ai-chat-thread" aria-live="polite">
            {session.intro.map((line, index) => (
              <p key={`intro-${index}`} className="bubble bubble-them bubble-in">
                {line}
              </p>
            ))}
            {session.turns.map((turn, index) => (
              <div key={index} className={turn.role === 'user' ? 'ai-chat-row is-me' : 'ai-chat-row'}>
                <p className={turn.role === 'user' ? 'bubble bubble-me' : 'bubble bubble-them'}>{turn.content}</p>
                {turn.note && (
                  <details className="ai-chat-note">
                    <summary>{DM_COPY.noteSummary}</summary>
                    <p>{turn.note}</p>
                  </details>
                )}
              </div>
            ))}
            {sending && (
              <div className="bubble bubble-them bubble-typing" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={endRef} />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {session.finished ? (
            <div className="dm-time-end">
              <p className="dm-time-line">{DM_COPY.timeOver(name)}</p>
              <RewardNotice reward={session.finished} characterId={characterId} />
              <button type="button" className="btn btn-reply btn-block" onClick={() => setSession(null)}>
                {DM_COPY.close}
              </button>
            </div>
          ) : (
            <>
              <form className="ai-chat-form" onSubmit={submit}>
                <input
                  className="text-input"
                  value={text}
                  maxLength={500}
                  autoComplete="off"
                  aria-label={`${name}에게 보낼 말`}
                  placeholder={DM_COPY.placeholder(name)}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                  {DM_COPY.send}
                </button>
              </form>
              <div className="ai-chat-foot">
                <span>{session.started ? DM_COPY.turnsLeft(left) : DM_COPY.timeUsedNote}</span>
                <button type="button" className="ai-chat-finish" disabled={sending} onClick={() => finish(session)}>
                  {DM_COPY.finish}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
