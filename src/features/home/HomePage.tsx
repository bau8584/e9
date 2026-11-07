import { useState } from 'react';
import { Portrait } from '../../components/Portrait';
import { RankingList, useRanking } from '../../components/RankingList';
import { getCharacter, getDm, getMissionCount, getReading } from '../../data';
import { bonds } from '../../data/bonds';
import { markStageSeen, readSeenStage, useBondStage } from '../../store/bond';
import { isSeasonComplete, type Stage } from '../../store/progress';
import { goTo, useSnapshot } from '../../store/store';
import { BondMoment } from './BondMoment';
import './home.css';

const missionAction: Record<Exclude<Stage, 'done'>, { text: string; label: string; screen: 'dm' | 'reading' }> = {
  dm: { text: 'DM에 답하면 오늘의 원문이 열려요.', label: 'DM에 답하기', screen: 'dm' },
  reading: { text: '짧은 원문을 읽고 문제를 맞혀 보세요.', label: '원문 읽기', screen: 'reading' },
  draw: { text: '정답이에요. 카드가 기다리고 있어요.', label: '카드 뽑기', screen: 'reading' },
};

// 새 DM 배너의 도착 효과는 미션마다 한 번만. 저장하지 않으므로 새로고침하면 다시 보인다.
const arrivedBanners = new Set<string>();

export function HomePage() {
  const { progress } = useSnapshot();
  const ranking = useRanking(progress.favoriteId, progress.score);
  const [arriving] = useState(() => {
    const key = `${progress.favoriteId}:${progress.missionIndex}`;
    if (progress.dmRead || arrivedBanners.has(key)) return false;
    arrivedBanners.add(key);
    return true;
  });
  const bondStage = useBondStage();
  const [seenStage, setSeenStage] = useState(() => (progress.favoriteId ? readSeenStage(progress.favoriteId) : 0));
  if (!progress.favoriteId || !ranking) return null;
  const character = getCharacter(progress.favoriteId);
  const bond = bonds[character.id][bondStage];
  const fill = (text: string) => text.replaceAll('{name}', progress.nickname);
  if (bondStage > seenStage) {
    return (
      <BondMoment
        character={character}
        bond={bond}
        stage={bondStage}
        fill={fill}
        onClose={() => {
          markStageSeen(character.id, bondStage);
          setSeenStage(bondStage);
          window.scrollTo(0, 0);
        }}
      />
    );
  }
  const dm = getDm(character.id, progress.missionIndex);
  const reading = getReading(character.id, progress.missionIndex);
  const missionCount = getMissionCount(character.id);
  const action = progress.stage === 'done' ? null : missionAction[progress.stage];

  return (
    <div className="page home">
      <section className="hero-card">
        <Portrait character={character} className="hero-portrait" stage={bondStage} />
        <div className="hero-text">
          <p className="hero-badge">{bond.title}</p>
          <h1 className="hero-name">{progress.nickname}</h1>
          <p className="hero-english">{character.englishName}</p>
          <p className="hero-stats">
            내 점수 <strong data-testid="my-score">{progress.score}</strong>점, 카드 <strong>{progress.cards.length}</strong>장
          </p>
          <p className="hero-greeting">{fill(bond.greeting)}</p>
        </div>
      </section>

      {isSeasonComplete(progress) ? (
        <section className="panel" data-testid="season-complete">
          <h2 className="section-title">이번 시즌 완료</h2>
          <p className="mission-text">
            {character.name}의 미션 {missionCount}개를 모두 끝냈어요. 다음 시즌의 DM과 원문은 준비 중이에요.
          </p>
          {bondStage === 2 && (
            <>
              <p className="mission-text">최애가 당신의 책장을 궁금해해요. 읽은 책을 한 권 등록해 보세요.</p>
              <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('myroom')}>
                내 방에 책 등록하기
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="panel">
          <h2 className="section-title">
            오늘의 읽기 미션 {progress.missionIndex + 1}/{missionCount}
          </h2>
          <p className="mission-title">{reading.title}</p>
          {action && (
            <>
              <p className="mission-text">{action.text}</p>
              <button type="button" className="btn btn-primary btn-block" onClick={() => goTo(action.screen)}>
                {action.label}
              </button>
            </>
          )}
        </section>
      )}

      <button type="button" className={arriving ? 'dm-banner dm-banner-arrive' : 'dm-banner'} onClick={() => goTo('dm')}>
        <span className="dm-banner-label">{progress.dmChoiceId ? `${character.nameWith}의 DM` : `새 DM, ${character.name}`}</span>
        <span className="dm-banner-text">{dm.preview}</span>
      </button>

      <RankingList ranking={ranking} />
    </div>
  );
}
