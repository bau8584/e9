import { NietzscheCards } from './NietzscheCards';
import { useEffect, useRef, useState } from 'react';
import packPage from './philosopher-pack.html?raw';
import { Portrait } from '../../components/Portrait';
import { RankingList, useRanking } from '../../components/RankingList';
import { getCharacter, getDm, getMissionCount, getReading } from '../../data';
import { bonds } from '../../data/bonds';
import { markStageSeen, readSeenStage, useBondStage } from '../../store/bond';
import { isSeasonComplete, type Stage } from '../../store/progress';
import { goTo, useSnapshot } from '../../store/store';
import { BondMoment } from './BondMoment';
import './home.css';

const portraitKey = 'hipdok.philosopher.cards.v1';
const catalog: {name:string; theme:string; image:string}[] = JSON.parse(packPage.split('<script id="portrait-data" type="application/json">')[1].split('</script>')[0]);
function validIds(value: unknown): number[] {
  return Array.isArray(value) ? [...new Set(value.filter(id => Number.isInteger(id) && catalog[id]))] : [];
}
function readPortraits() {
  try { return validIds(JSON.parse(localStorage.getItem(portraitKey) || '[]')); } catch { return []; }
}

const missionAction: Record<Exclude<Stage, 'done'>, { text: string; label: string; screen: 'dm' | 'reading' }> = {
  dm: { text: 'DM에 답하면 오늘의 원문이 열려요.', label: 'DM에 답하기', screen: 'dm' },
  reading: { text: '짧은 원문을 읽고 문제를 맞혀 보세요.', label: '원문 읽기', screen: 'reading' },
  draw: { text: '정답이에요. 카드가 기다리고 있어요.', label: '카드 뽑기', screen: 'reading' },
};

// 새 DM 배너의 도착 효과는 미션마다 한 번만. 저장하지 않으므로 새로고침하면 다시 보인다.
const arrivedBanners = new Set<string>();

export function HomePage() {
  const packDialog = useRef<HTMLDialogElement>(null);
  const [owned, setOwned] = useState(readPortraits);
  useEffect(() => {
    const changed = (event: Event) => setOwned(validIds((event as CustomEvent).detail));
    const synced = (event: StorageEvent) => { if (!event.key || event.key === portraitKey) setOwned(readPortraits()); };
    window.addEventListener('hipdok:portraits', changed);
    window.addEventListener('storage', synced);
    return () => { window.removeEventListener('hipdok:portraits', changed); window.removeEventListener('storage', synced); };
  }, []);
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

      <section className="panel">
        <h2 className="section-title">사유의 초상</h2>
        <p className="mission-text">배움·관계·자유 팩에서 사상가를 만나고 초상 카드를 모아 보세요.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => packDialog.current?.showModal()}>
          사상가 카드팩 열기
        </button>
        <h3 style={{margin: '18px 0 8px'}}>내가 뽑은 카드 <small>{owned.length} / {catalog.length}</small></h3>
        {owned.length ? <ul aria-label="내가 뽑은 카드" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(104px,100%),1fr))',gap:10,listStyle:'none',padding:0,margin:0}}>
          {owned.map(id => <li key={id} style={{border:'1px solid #dfd3bf',borderRadius:10,overflow:'hidden',background:'#fffaf1'}}>
            <img src={catalog[id].image} alt="" style={{width:'100%',aspectRatio:'3/4',objectFit:'cover',display:'block'}} />
            <div style={{padding:8}}><strong>{catalog[id].name}</strong><br/><small>{catalog[id].theme}</small></div>
          </li>)}
        </ul> : <p className="mission-text">첫 팩을 열면 여기에 나의 첫 초상이 걸려요.</p>}
      </section>
      <dialog ref={packDialog} aria-label="사상가 카드팩" style={{ padding: 0, width: 'min(880px, 96vw)', maxWidth: '96vw', border: 0, borderRadius: 14, background: '#132725', color: '#f7efda', margin: 'auto' }}>
        <form method="dialog" style={{ textAlign: 'right', padding: '8px 16px' }}>
          <button type="submit" className="btn" style={{ color: '#f7efda', background: 'transparent' }}>닫기</button>
        </form>
        <iframe title="사유의 초상 카드팩" srcDoc={packPage} loading="lazy" style={{ display: 'block', border: 0, width: '100%', height: 'min(76dvh, 710px)' }} />
      </dialog>
      <NietzscheCards />
      <RankingList ranking={ranking} />
    </div>
  );
}
