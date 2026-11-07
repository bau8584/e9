// 내 방의 '내 문장 카드' 구역. 입덕 쪽 기록은 myRoomData 로만 읽는다.
import { Copy, RotateCcw } from 'lucide-react';
import { QuoteCardView } from '../../components/QuoteCardView';
import type { QuoteCard } from '../../data';
import { cardShareText, goToMission, useMyRoomData } from './myRoomData';
import type { Library } from './useLibrary';

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

export function MyCards({ lib }: { lib: Library }) {
  const { favorite, cards, score, groups } = useMyRoomData();
  async function copy(card: QuoteCard) {
    lib.say((await copyText(cardShareText(card))) ? '카드 문장을 복사했어요.' : '복사하지 못했어요. 문장을 길게 눌러 복사해 주세요.');
  }
  return (
    <section className="my-cards" aria-labelledby="my-cards-title">
      <div className="my-cards-head">
        <div>
          <span className="eyebrow">MY QUOTE CARDS</span>
          <h2 id="my-cards-title">내 문장 카드<span>{cards.length}</span></h2>
        </div>
        <div className="my-cards-stats">
          {favorite && <span className="fan-tag">{favorite.name} 팬</span>}
          <span className="score-tag"><strong>{score}</strong>점</span>
        </div>
      </div>
      {groups.length === 0 ? (
        <div className="my-cards-empty">
          <p>아직 뽑은 카드가 없어요. 첫 미션을 끝내면 문장 카드가 여기에 놓여요.</p>
          <button className="primary" onClick={goToMission}>첫 미션 하러 가기</button>
        </div>
      ) : (
        groups.map((group) => (
          <div className="my-cards-group" key={group.character.id}>
            <h3>{group.character.name}{group.isFavorite && <small>최애</small>}</h3>
            <div className="my-cards-grid">
              {group.cards.map((card) => (
                <div className="my-card-item" key={card.id}>
                  <div className="fandom-scope"><QuoteCardView card={card} /></div>
                  <button className="secondary" onClick={() => copy(card)} aria-label={`${group.character.name} ${card.rarity} 카드 문장 복사`}>
                    <Copy size={15} />문장 복사
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <div className="my-cards-foot">
        <p>초기화해도 서고의 책 기록은 지워지지 않아요.</p>
        <button className="text-btn" onClick={() => lib.setPopup('reset')}><RotateCcw size={14} />카드와 입덕 기록 초기화</button>
      </div>
    </section>
  );
}
