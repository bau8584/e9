import { useEffect, useRef, useState, type FormEvent } from 'react';
import './ai-chat.css';

// DM 아래에서 직접 입력해 나누는 AI 대화. 미션과 호감도에는 영향을 주지 않는다.
// 대화는 이 탭에만 잠시 두고(sessionStorage) 저장 키와 진행 기록은 건드리지 않는다.
// 개발 화면은 내 컴퓨터의 시험 서버로, 공개 사이트는 미니 PC의 AI 서버로 보낸다.
// 파일로 연 힙독.html 은 서버에 닿지 못하므로 칸을 보이지 않는다.
export const AI_CHARACTERS = ['xunzi', 'nietzsche'];
const CHAT_URL = import.meta.env.DEV ? '/api/chat' : 'https://hipdok.deokgu.com/chat';
export const aiChatAvailable = () => window.location.protocol !== 'file:';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  note?: string;
}

const keyOf = (id: string) => `hipdok:ai-chat:${id}`;

function readTurns(id: string): Turn[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(keyOf(id)) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Turn[]) : [];
  } catch {
    return [];
  }
}

export function AiChat({ characterId, name, stage, context }: { characterId: string; name: string; stage: number; context: string }) {
  const [turns, setTurns] = useState<Turn[]>(() => readTurns(characterId));
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(keyOf(characterId), JSON.stringify(turns));
    } catch {
      /* 저장이 막혀도 대화는 이어진다 */
    }
    endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [characterId, turns, sending]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    const history: Turn[] = [...turns, { role: 'user', content }];
    setTurns(history);
    setText('');
    setSending(true);
    setError('');
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ character: characterId, stage, context, messages: history.map(({ role, content: c }) => ({ role, content: c })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const bubbles: string[] = data.bubbles;
      setTurns([...history, ...bubbles.map((b, i): Turn => ({ role: 'assistant', content: b, note: i === bubbles.length - 1 ? data.note : '' }))]);
    } catch (e) {
      setTurns(turns);
      setText(content);
      setError(e instanceof SyntaxError || e instanceof TypeError || !(e as Error).message ? 'AI 서버에 연결하지 못했어요. 서버가 켜져 있는지 확인하고 다시 보내 주세요.' : (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="ai-chat" aria-label={`${name}와 자유 대화`}>
      <p className="ai-chat-label">직접 대화하기</p>
      <p className="ai-chat-notice">실제 인물이 아니라 AI가 재구성한 캐릭터예요. 보낸 말은 답을 만들기 위해 AI 회사(Anthropic)로 전달되고 힙독 서버에는 저장하지 않아요. 이름이나 연락처 같은 개인정보는 적지 말아 주세요. 대화는 탭을 닫으면 사라져요.</p>
      <div className="ai-chat-thread" aria-live="polite">
        {turns.map((turn, index) => (
          <div key={index} className={turn.role === 'user' ? 'ai-chat-row is-me' : 'ai-chat-row'}>
            <p className={turn.role === 'user' ? 'bubble bubble-me' : 'bubble bubble-them'}>{turn.content}</p>
            {turn.note && (
              <details className="ai-chat-note">
                <summary>왜 이런 말을 할까?</summary>
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
      <form className="ai-chat-form" onSubmit={submit}>
        <input
          className="text-input"
          value={text}
          maxLength={500}
          autoComplete="off"
          aria-label={`${name}에게 보낼 말`}
          placeholder={`${name}에게 직접 말해 보세요`}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
          보내기
        </button>
      </form>
    </section>
  );
}
