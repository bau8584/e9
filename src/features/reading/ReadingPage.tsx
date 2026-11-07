import { useState } from 'react';
import { ReviewLabel } from '../../components/Labels';
import { getCharacter, getReading, type Reading } from '../../data';
import { answerQuiz, clearWrongAnswer, goTo, useSnapshot } from '../../store/store';
import { CardDraw } from '../card/CardDraw';
import './reading.css';

function Passage({ reading }: { reading: Reading }) {
  return (
    <section className="passage">
      <p className="passage-tags">
        <ReviewLabel />
      </p>
      <blockquote className="passage-original" lang="">{reading.original}</blockquote>
      <p className="passage-translation">{reading.translation}</p>
      <p className="passage-note">제작진 임시 번역</p>
      <p className="passage-source">{reading.source}</p>
    </section>
  );
}

export function ReadingPage() {
  const { progress } = useSnapshot();
  // 이 화면에서 방금 정답을 맞혔는지. 새로고침 뒤에는 축하 문구만 빠진다.
  const [justCorrect, setJustCorrect] = useState(false);
  if (!progress.favoriteId) return null;
  const character = getCharacter(progress.favoriteId);
  const reading = getReading(character.id);

  if (progress.stage === 'dm') {
    return (
      <div className="page">
        <h1 className="title">오늘의 원문</h1>
        <p className="gate-text">{character.name}의 DM에 먼저 답해 주세요. 그러면 원문이 열려요.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('dm')}>
          DM 보러 가기
        </button>
      </div>
    );
  }

  if (progress.stage === 'draw' || progress.stage === 'done') {
    return (
      <div className="page reading">
        {justCorrect && <p className="correct-note" role="status">정답입니다.</p>}
        <CardDraw />
      </div>
    );
  }

  const wrongId = progress.lastWrongOptionId;

  return (
    <div className="page reading">
      <p className="reading-kicker">{character.name}의 원문</p>
      <h1 className="title">{reading.title}</h1>
      <Passage reading={reading} />
      <section className="quiz">
        <h2 className="section-title">{reading.question}</h2>
        <div className="quiz-options">
          {reading.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn btn-option${wrongId === option.id ? ' is-wrong' : ''}`}
              disabled={wrongId !== null}
              onClick={() => setJustCorrect(answerQuiz(option.id))}
            >
              {option.text}
            </button>
          ))}
        </div>
        {wrongId && (
          <div className="hint" role="alert">
            <p className="hint-title">아깝습니다. 이 대목을 다시 보세요.</p>
            <mark className="hint-passage">{reading.hintPassage}</mark>
            <p className="hint-note">{reading.hintNote}</p>
            <button type="button" className="btn btn-primary btn-block" onClick={clearWrongAnswer}>
              다시 풀기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
