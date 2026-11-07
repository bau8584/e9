import { Portrait } from '../../components/Portrait';
import { RankingList } from '../../components/RankingList';
import { getCharacter, getDm, getReading } from '../../data';
import type { Stage } from '../../store/progress';
import { goTo, useSnapshot } from '../../store/store';
import './home.css';

const missionAction: Record<Exclude<Stage, 'done'>, { text: string; label: string; screen: 'dm' | 'reading' }> = {
  dm: { text: 'DM에 답하면 오늘의 원문이 열려요.', label: 'DM에 답하기', screen: 'dm' },
  reading: { text: '짧은 원문을 읽고 문제를 맞혀 보세요.', label: '원문 읽기', screen: 'reading' },
  draw: { text: '정답이에요. 카드가 기다리고 있어요.', label: '카드 뽑기', screen: 'reading' },
};

export function HomePage() {
  const { progress } = useSnapshot();
  if (!progress.favoriteId) return null;
  const character = getCharacter(progress.favoriteId);
  const dm = getDm(character.id);
  const reading = getReading(character.id);
  const action = progress.stage === 'done' ? null : missionAction[progress.stage];

  return (
    <div className="page home">
      <section className="hero-card">
        <Portrait character={character} className="hero-portrait" />
        <div className="hero-text">
          <p className="hero-badge">{character.name} 팬</p>
          <h1 className="hero-name">{progress.nickname}</h1>
          <p className="hero-english">{character.englishName}</p>
          <p className="hero-stats">
            내 점수 <strong data-testid="my-score">{progress.score}</strong>점, 카드 <strong>{progress.cards.length}</strong>장
          </p>
        </div>
      </section>

      <button type="button" className="dm-banner" onClick={() => goTo('dm')}>
        <span className="dm-banner-label">{progress.dmChoiceId ? `${character.name}와의 DM` : `새 DM, ${character.name}`}</span>
        <span className="dm-banner-text">{dm.preview}</span>
      </button>

      <section className="panel">
        <h2 className="section-title">오늘의 읽기 미션</h2>
        <p className="mission-title">{reading.title}</p>
        {action ? (
          <>
            <p className="mission-text">{action.text}</p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => goTo(action.screen)}>
              {action.label}
            </button>
          </>
        ) : (
          <p className="mission-text">오늘 미션 완료. 다음 DM과 원문은 준비 중이에요.</p>
        )}
      </section>

      <RankingList favoriteId={character.id} score={progress.score} />
    </div>
  );
}
