import { CharacterSwitcher } from '../../components/CharacterSwitcher';
import { Portrait } from '../../components/Portrait';
import { RankingList, useRanking } from '../../components/RankingList';
import { getCharacter } from '../../data';
import { bonds, greetingOf } from '../../data/bonds';
import { booksOf } from '../../data/books';
import { episodesOf } from '../../data/episodes';
import { useBond } from '../../store/bond';
import { episodeSlotsLeft, todayKey, useFan, type DailyGift } from '../../store/fan';
import { goTo, useSnapshot } from '../../store/store';
import { PackOpener } from '../card/PackOpener';
import { josa } from '../dm/dmCopy';
import { openPassage } from '../reading/nav';
import { BondPanel } from './BondPanel';
import { giftItems, giftLine, togetherText } from './dailyCopy';
import './home.css';

interface Props {
  /** 오늘 처음 와서 받은 선물. App이 checkIn으로 받아 넘긴다. */
  gift?: DailyGift | null;
  onGiftSeen?: () => void;
}

// 단계 장면(BondMoment)은 App의 BondMomentHost가 어느 화면에서든 띄운다.
export function HomePage({ gift = null, onGiftSeen }: Props) {
  const { progress } = useSnapshot();
  const ranking = useRanking(progress.favoriteId, progress.score);
  const bondStatus = useBond();
  const fan = useFan();
  if (!progress.favoriteId || !ranking) return null;
  const character = getCharacter(progress.favoriteId);
  const name = character.name;
  const bondStage = bondStatus.stage;
  const bond = bonds[character.id][bondStage];
  const fill = (text: string) => text.replaceAll('{name}', progress.nickname);
  const episodes = episodesOf(character.id);
  const passages = booksOf(character.id).flatMap((book) => book.passages);
  const openEpisode = episodeSlotsLeft(character.id, fan) > 0 ? episodes.find((ep) => ep.minStage <= bondStage && !(ep.id in fan.episodes)) : undefined;
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
          <p className="hero-together" data-testid="home-days">
            {togetherText(name, fan.days)}
          </p>
          <p className="hero-stats">
            {cardKinds > 0 ? `${name}의 카드 ${cardKinds}종을 모았어요` : `${name}의 첫 카드를 기다리고 있어요`}
          </p>
          <p className="hero-greeting">{fill(greetingOf(bond, fan.days, todayKey()))}</p>
        </div>
      </section>

      {gift && (
        <section className={`home-gift${gift.milestone ? ' is-milestone' : ''}`} aria-label={`${josa(name, '이', '가')} 건넨 선물`} data-testid="home-gift">
          <p className="home-gift-kicker">{gift.milestone ? `함께한 지 ${gift.milestone}일째 특별 선물` : '오늘의 선물'}</p>
          <p className="home-gift-line">
            <span className="home-gift-who">{name}</span>
            {fill(giftLine(character.id, gift))}
          </p>
          <ul className="home-gift-items">
            {giftItems(gift).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <PackOpener characterId={character.id} />
          {onGiftSeen && (
            <button type="button" className="btn home-gift-close" onClick={onGiftSeen}>
              고마워요
            </button>
          )}
        </section>
      )}

      <section className="home-gives" aria-label={`${josa(name, '이', '가')} 건네는 것`}>
        {episodes.length === 0 && passages.length === 0 ? (
          <p className="home-soon">{name}의 이야기는 준비 중이에요.</p>
        ) : (
          <>
            {episodes.length > 0 &&
              (openEpisode ? (
                <button type="button" className="dm-banner" onClick={() => goTo('dm')}>
                  <span className="dm-banner-label">새 메시지, {name}</span>
                  <span className="dm-banner-text">{fill(openEpisode.preview)}</span>
                </button>
              ) : (
                <button type="button" className="dm-banner" onClick={() => goTo('dm')}>
                  <span className="dm-banner-label">직접 이야기하기</span>
                  <span className="dm-banner-text">
                    {fan.chatTickets > 0
                      ? `${josa(name, '이', '가')} 이야기할 시간이 ${fan.chatTickets}번 남았어요.`
                      : `${josa(name, '과', '와')} 나눌 이야기가 더 생기면 알려 줄게요.`}
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
                  <span className="dm-banner-text">서재에서 {name}의 글을 다시 펼쳐 볼 수 있어요.</span>
                </button>
              ))}
          </>
        )}
        {/* 선물 칸이 떠 있으면 팩은 거기서 연다 */}
        {!gift && <PackOpener characterId={character.id} />}
      </section>

      <BondPanel stages={bonds[character.id]} status={bondStatus} fill={fill} name={name} />

      <RankingList ranking={ranking} />
    </div>
  );
}
