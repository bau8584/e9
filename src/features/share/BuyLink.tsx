import { getPurchaseLink } from '../../data/purchase';
import './share.css';

/** 책 끝까지 읽으러 가는 길. 연결 정보가 없는 책이면 아무것도 그리지 않는다. */
export function BuyLink({ bookId }: { bookId: string }) {
  const link = getPurchaseLink(bookId);
  if (!link) return null;
  return (
    <div className="buy-link">
      <a className="btn buy-link-btn" href={link.href} target="_blank" rel="noopener noreferrer">
        이 책 끝까지 읽기
      </a>
      {link.temporary ? (
        <small className="buy-link-note">서점 검색으로 이동해요</small>
      ) : link.publisher ? (
        <small className="buy-link-note">{link.publisher}</small>
      ) : null}
    </div>
  );
}
