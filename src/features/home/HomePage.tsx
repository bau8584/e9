import { useState } from 'react';
import { CharacterSwitcher } from '../../components/CharacterSwitcher';
import { Portrait } from '../../components/Portrait';
import { RankingList, useRanking } from '../../components/RankingList';
import { getCharacter } from '../../data';
import { bonds } from '../../data/bonds';
import { booksOf } from '../../data/books';
import { episodesOf } from '../../data/episodes';
import { markStageSeen, readSeenStage, useBond } from '../../store/bond';
import { useFan } from '../../store/fan';
import { goTo, useSnapshot } from '../../store/store';
import { PackOpener } from '../card/PackOpener';
import { openPassage } from '../reading/nav';
import { BondMoment } from './BondMoment';
import { BondPanel } from './BondPanel';
import './home.css';

export function HomePage() {
  const { progress } = useSnapshot();
  const ranking = useRanking(progress.favoriteId, progress.score);
  const bondStatus = useBond();
  const fan = useFan();
  const [seenStage, setSeenStage] = useState(() => (progress.favoriteId ? readSeenStage(progress.favoriteId) : 0));
  if (!progress.favoriteId || !ranking) return null;
  const character = getCharacter(progress.favoriteId);
  const bondStage = bondStatus.stage;
  const bond = bonds[character.id][bondStage];
  const fill = (text: string) => text.replaceAll('{name}', progress.nickname);
  if (bondStatus.earned > seenStage) {
    return (
      <BondMoment
        character={character}
        bond={bonds[character.id][bondStatus.earned]}
        stage={bondStatus.earned}
        fill={fill}
        onClose={() => {
          markStageSeen(character.id, bondStatus.earned);
          setSeenStage(bondStatus.earned);
          window.scrollTo(0, 0);
        }}
      />
    );
  }
  const episodes = episodesOf(character.id);
  const passages = booksOf(character.id).flatMap((book) => book.passages);
  const openEpisode = episodes.find((ep) => ep.minStage <= bondStage && !(ep.id in fan.episodes));
  const unread = passages.find((p) => !(p.id in fan.passages));
  const cardKinds = Object.values(fan.cards).filter((n) => n > 0).length;

  return (
    <div className="page home">
      <CharacterSwitcher />
      <section className="hero-card">
        <Portrait character={character} className="hero-portrait" stage={bondStage} />
        <div className="hero-text">
          <p className="hero-badge">{bond.title}</p>
          <h1 className="hero-name">{progress.nickname}</h1>
          <p className="hero-english">{character.englishName}</p>
          <p className="hero-stats">
            {cardKinds > 0 ? `${character.name}의 카드 ${cardKinds}종을 모았어요` : `${character.name}의 첫 카드를 기다리고 있어요`}
          </p>
          <p className="hero-greeting">{fill(bond.greeting)}</p>
        </div>
      </section>


      <section className="home-gives" aria-label={`${character.name}이 건네는 것`}>
        {episodes.length === 0 && passages.length === 0 ? (
          <p className="home-soon">{character.name}의 이야기는 준비 중이에요.</p>
        ) : (
          <>
            {episodes.length > 0 &&
              (openEpisode ? (
                <button type="button" className="dm-banner" onClick={() => goTo('dm')}>
                  <span className="dm-banner-label">새 메시지, {character.name}</span>
                  <span className="dm-banner-text">{fill(openEpisode.preview)}</span>
                </button>
              ) : (
                <button type="button" className="dm-banner" onClick={() => goTo('dm')}>
                  <span className="dm-banner-label">직접 이야기하기</span>
                  <span className="dm-banner-text">
                    {fan.chatTickets > 0
                      ? `${character.name}이 이야기할 시간이 ${fan.chatTickets}번 남았어요.`
                      : `${character.name}과 나눌 이야기가 더 생기면 알려 줄게요.`}
                  </span>
                </button>
              ))}
            {passages.length > 0 &&
              (unread ? (
                <button type="button" className="dm-banner home-read" onClick={() => openPassage(unread.id)}>
                  <span className="dm-banner-label">읽어 줬으면 하는 글, {unread.minutes}분</span>
                  <span className="home-read-title">{unread.title}</span>
                  <span className="dm-banner-text">{fill(unread.hook)}</span>
                </button>
              ) : (
                <button type="button" className="dm-banner home-read" onClick={() => goTo('reading')}>
                  <span className="dm-banner-label">다시 읽기</span>
                  <span className="dm-banner-text">서재에서 {character.name}의 글을 다시 펼쳐 볼 수 있어요.</span>
                </button>
              ))}
          </>
        )}
        <PackOpener characterId={character.id} />
      </section>
<BondPanel stages={bonds[character.id]} status={bondStatus} fill={fill} />

      <RankingList ranking={ranking} />
    </div>
  );
}
