// 내 방의 카드 구역: 카드 팩 열기(지금 최애) + 카드 앨범. 입덕 쪽 기록은 myRoomData 와 카드 조각으로만 읽는다.
// 팩과 앨범은 입덕 쪽 조각이라 .fandom-scope 로 감싼다. (CardSummary, copyText 는 지금 화면에 쓰지 않는다.)
import { Album } from '../card/Album';
import { PackOpener } from '../card/PackOpener';
import { goTo, useSnapshot } from '../../store/store';
import { useMyRoomData } from './myRoomData';

/** 클립보드에 복사한다. 외부로 보내지 않는다. 파일로 열어 clipboard 를 못 쓰면 옛 방식으로 시도한다. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}

const scrollToCards = () => document.getElementById('my-cards')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** 내 방 맨 위 요약. 새 인물 카드 수와 남은 팩을 보여 주고 카드 구역으로 바로 간다. */
export function CardSummary() {
  const { favorite, fanCards, fanTotal, packs, shards } = useMyRoomData();
  return (
    <section className="my-cards-summary" aria-label="내 카드 요약">
      <p>
        {favorite && <span className="fan-tag">{favorite.name} 팬</span>}
        <span>카드 <strong>{fanCards}</strong> / {fanTotal}장, 조각 <strong>{shards}</strong>개</span>
      </p>
      <div>
        <button className="secondary" onClick={scrollToCards}>앨범 보기</button>
        {packs > 0 ? (
          <button className="primary" onClick={scrollToCards}>카드 팩 {packs}개 열기</button>
        ) : (
          <button className="primary" onClick={() => goTo('reading')}>읽고 팩 받기</button>
        )}
      </div>
    </section>
  );
}

export function MyCards() {
  const { fanCards, fanTotal, packs } = useMyRoomData();
  const favoriteId = useSnapshot().progress.favoriteId;
  return (
    <section id="my-cards" className="my-cards" aria-labelledby="my-cards-title">
      <div className="my-cards-head">
        <h2 id="my-cards-title">내 카드<span>{fanCards} / {fanTotal}장</span></h2>
      </div>
      <div className="fandom-scope">
        {favoriteId && <div className="my-cards-pack"><PackOpener characterId={favoriteId} /></div>}
        {fanCards === 0 && packs === 0 && (
          <div className="my-cards-empty">
            <p>아직 카드가 없어요. 대목을 읽거나 대화를 마치면 카드 팩을 하나씩 받아요.</p>
            <button className="primary" onClick={() => goTo('reading')}>읽으러 가기</button>
          </div>
        )}
        <div className="my-cards-album"><Album /></div>
      </div>
    </section>
  );
}
