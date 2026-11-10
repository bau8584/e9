// 읽기 탭 = 최애의 서재. 언제든 열린다. 대목을 펼치면 인물이 옆에서 끼어들며 같이 읽고, 끝에서 묻는다.
// 옛 미션 기록(hipdok:v1)은 읽지도 바꾸지도 않는다. 새 기록은 store/fan.ts 로만 남긴다.
import { useEffect, useRef, useState } from 'react';
import { CharacterSwitcher } from '../../components/CharacterSwitcher';
import { Portrait } from '../../components/Portrait';
import { getCharacter, type Character } from '../../data';
import { booksOf, getBook, getPassage } from '../../data/books';
import type { Book, Passage, PassageOption } from '../../data/fanTypes';
import { completePassage, getFan, PASSAGE_AFFINITY, setTalkTopic, TICKET_CAP, useFan } from '../../store/fan';
import { goTo, useSnapshot } from '../../store/store';
import { PackOpener } from '../card/PackOpener';
import { prefersReducedMotion, useMessageReveal } from '../dm/useMessageReveal';
import { BuyLink } from '../share/BuyLink';
import { closePassage, openPassage, useOpenPassageId } from './nav';
import './reading.css';

const fill = (text: string, nickname: string) => text.replaceAll('{name}', nickname || '당신');

export function ReadingPage() {
  const { progress } = useSnapshot();
  const openId = useOpenPassageId();
  if (!progress.favoriteId) return null;
  const passage = openId ? getPassage(openId) : undefined;
  const book = passage ? getBook(passage.bookId) : undefined;
  if (passage && book) return <PassageView key={passage.id} book={book} passage={passage} nickname={progress.nickname} />;
  return <Library character={getCharacter(progress.favoriteId)} nickname={progress.nickname} />;
}

/* ---------- 서재 ---------- */

function Library({ character, nickname }: { character: Character; nickname: string }) {
  const read = useFan().passages;
  const shelf = booksOf(character.id);

  return (
    <div className="page rd-library">
      <CharacterSwitcher />
      <header className="rd-library-head">
        <p className="rd-kicker">언제든 같이 펼쳐요</p>
        <h1 className="title">{character.name}의 서재</h1>
      </header>

      {shelf.length === 0 ? (
        <div className="rd-empty panel">
          <Portrait character={character} className="rd-empty-portrait" />
          <p>{character.name}의 서재는 아직 꾸미는 중이에요. 책이 들어오면 여기서 같이 읽을 수 있어요.</p>
        </div>
      ) : (
        shelf.map((book) => <Shelf key={book.id} book={book} character={character} nickname={nickname} read={read} />)
      )}
    </div>
  );
}

function Shelf({ book, character, nickname, read }: { book: Book; character: Character; nickname: string; read: Record<string, string> }) {
  const unread = book.passages.filter((p) => !(p.id in read)).length;
  return (
    <section className="rd-book" aria-labelledby={`rd-book-${book.id}`}>
      <div className="rd-cover">
        <h2 id={`rd-book-${book.id}`} className="rd-cover-title">
          {book.title}
        </h2>
        <p className="rd-cover-original">{book.original}</p>
        <div className="rd-intro">
          <span aria-hidden="true">
            <Portrait character={character} className="rd-mini-portrait" />
          </span>
          <p className="rd-intro-text">
            <span className="rd-who">{character.name}</span>
            {fill(book.intro, nickname)}
          </p>
        </div>
      </div>
      <p className="rd-shelf-note">
        {unread > 0 ? `아직 안 읽은 이야기 ${unread}편` : '전부 같이 읽었어요. 다시 펼쳐 봐도 좋아요.'}
      </p>
      <ul className="rd-passages">
        {book.passages.map((p) => {
          const done = p.id in read;
          return (
            <li key={p.id}>
              <button type="button" className={`rd-passage-row${done ? ' is-read' : ''}`} onClick={() => openPassage(p.id)}>
                <span className="rd-row-top">
                  <span className="rd-row-title">{p.title}</span>
                  <span className="rd-row-meta">
                    {done ? '읽음' : '새 이야기'} · {p.minutes}분
                  </span>
                </span>
                <span className="rd-row-hook">{fill(p.hook, nickname)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- 읽는 화면 ---------- */

function useReadPosition() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return barRef;
}

function PassageView({ book, passage, nickname }: { book: Book; passage: Passage; nickname: string }) {
  const character = getCharacter(book.characterId);
  const barRef = useReadPosition();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const index = book.passages.findIndex((p) => p.id === passage.id);
  const next = index >= 0 ? book.passages[index + 1] : undefined;

  return (
    <div className="page rd-reader">
      <div className="rd-position" aria-hidden="true">
        <div ref={barRef} className="rd-position-bar" />
      </div>
      <button type="button" className="rd-back" onClick={closePassage}>
        서재로
      </button>
      <header className="rd-reader-head">
        <p className="rd-kicker">
          {book.title} · {passage.minutes}분
        </p>
        <h1 className="title">{passage.title}</h1>
        <p className="rd-source">{passage.source}</p>
      </header>

      <article className="rd-body">
        {passage.blocks.map((block, i) =>
          block.kind === 'text' ? (
            <p key={i} className="rd-text">
              {fill(block.text, nickname)}
            </p>
          ) : (
            <aside key={i} className="rd-aside">
              <span aria-hidden="true">
                <Portrait character={character} className="rd-mini-portrait" />
              </span>
              <p className="rd-aside-bubble">
                <span className="rd-who">{character.name}</span>
                {fill(block.text, nickname)}
              </p>
            </aside>
          ),
        )}
      </article>

      <Ending book={book} passage={passage} character={character} nickname={nickname} next={next} />
    </div>
  );
}

interface Reward {
  affinity: number;
  ticket: boolean;
}

function Ending({
  book,
  passage,
  character,
  nickname,
  next,
}: {
  book: Book;
  passage: Passage;
  character: Character;
  nickname: string;
  next?: Passage;
}) {
  const saved = useFan().passages[passage.id];
  const savedOption = passage.question.options.find((o) => o.id === saved);
  // 이 화면에서 방금 고른 답(연출을 다시 틀기 위해 회차를 같이 둔다)
  const [played, setPlayed] = useState<{ optionId: string; round: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [revealDone, setRevealDone] = useState(true);

  const chosen = played ? passage.question.options.find((o) => o.id === played.optionId) : savedOption;
  const showOptions = !chosen || picking;

  const choose = (option: PassageOption) => {
    const ticket = getFan().chatTickets < TICKET_CAP;
    const first = completePassage(book.characterId, passage.id, option.id, option.affinity);
    setReward(first ? { affinity: PASSAGE_AFFINITY + option.affinity, ticket } : null);
    setPicking(false);
    const animate = !prefersReducedMotion();
    setRevealDone(!animate);
    setPlayed((prev) => ({ optionId: option.id, round: (prev?.round ?? 0) + 1 }));
  };

  const talk = () => {
    setTalkTopic(passage.id);
    goTo('dm');
  };

  return (
    <section className="rd-ending" aria-label={`${character.name}의 질문`}>
      <div className="rd-thread" aria-live="polite">
        <div className="rd-them">
          <span aria-hidden="true">
            <Portrait character={character} className="rd-mini-portrait" />
          </span>
          <p className="rd-bubble rd-bubble-them">{fill(passage.question.prompt, nickname)}</p>
        </div>

        {showOptions ? (
          <div className="rd-options">
            {passage.question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`rd-option${option.id === chosen?.id ? ' is-before' : ''}`}
                onClick={() => choose(option)}
              >
                {fill(option.text, nickname)}
                {option.id === chosen?.id && <span className="rd-option-note">전에 고른 답</span>}
              </button>
            ))}
            {picking && (
              <button type="button" className="rd-link" onClick={() => setPicking(false)}>
                그대로 둘게요
              </button>
            )}
          </div>
        ) : (
          chosen && (
            <Reaction
              key={played ? `${played.optionId}-${played.round}` : `saved-${chosen.id}`}
              option={chosen}
              character={character}
              nickname={nickname}
              play={Boolean(played) && !revealDone}
              onDone={() => setRevealDone(true)}
            />
          )
        )}
      </div>

      {chosen && !picking && revealDone && (
        <>
          <button type="button" className="rd-link rd-repick" onClick={() => setPicking(true)}>
            다른 답 골라 보기
          </button>

          {reward && (
            <div className="rd-reward" role="status">
              <p className="rd-reward-head">{character.nameWith} 한 대목을 같이 읽었어요</p>
              <ul className="rd-reward-list">
                <li>{character.name}의 호감이 올랐어요 (+{reward.affinity})</li>
                <li>카드 팩 1개를 받았어요</li>
                <li>{reward.ticket ? '대화 시간 1회가 생겼어요' : '대화 시간은 이미 가득 모여 있어요'}</li>
              </ul>
            </div>
          )}
          <PackOpener characterId={book.characterId} />

          <div className="rd-actions">
            <button type="button" className="btn btn-primary btn-block" onClick={talk}>
              이 대목으로 {character.name}에게 말 걸기
            </button>
            {next && (
              <button type="button" className="btn btn-block rd-btn-quiet" onClick={() => openPassage(next.id)}>
                다음 이야기: {next.title}
              </button>
            )}
            <button type="button" className="btn btn-block rd-btn-quiet" onClick={closePassage}>
              서재로
            </button>
          </div>

          <div className="rd-book-foot">
            <BuyLink bookId={book.id} />
            <p className="rd-translation-note">{book.translationNote}</p>
          </div>
        </>
      )}
    </section>
  );
}

function Reaction({
  option,
  character,
  nickname,
  play,
  onDone,
}: {
  option: PassageOption;
  character: Character;
  nickname: string;
  play: boolean;
  onDone: () => void;
}) {
  // play는 처음 그릴 때만 본다. 연출 중에 부모가 다시 그려도 처음부터 다시 틀지 않는다.
  const [playing] = useState(play);
  const [texts] = useState(() => option.reaction.map((t) => fill(t, nickname)));
  const reveal = useMessageReveal(texts, playing, 'answer');

  useEffect(() => {
    if (reveal.done) onDone();
  }, [reveal.done, onDone]);

  return (
    <div className="rd-reaction" onClick={reveal.done ? undefined : reveal.skip}>
      <p className={`rd-bubble rd-bubble-me${playing ? ' rd-in' : ''}`}>{fill(option.text, nickname)}</p>
      {texts.slice(0, reveal.visibleCount).map((text, i) => (
        <div key={i} className={`rd-them${playing ? ' rd-in' : ''}`}>
          <span aria-hidden="true" className={i === 0 ? undefined : 'rd-portrait-gap'}>
            {i === 0 && <Portrait character={character} className="rd-mini-portrait" />}
          </span>
          <p className="rd-bubble rd-bubble-them">{text}</p>
        </div>
      ))}
      {reveal.phase === 'typing' && (
        <div className="rd-them" aria-hidden="true">
          <span className="rd-portrait-gap" />
          <div className="rd-bubble rd-bubble-them rd-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      {!reveal.done && <p className="rd-skip-hint">누르면 바로 넘어가요</p>}
    </div>
  );
}
