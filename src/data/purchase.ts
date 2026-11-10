// 책 구매 연결 표. 출판사가 정해지면 이 표의 publisher, url 만 채우면 된다(다른 곳은 손대지 않는다).
// url 이 없으면 서점 검색 주소를 임시로 쓴다. 상품 주소를 짐작해서 넣지 않는다.
export interface PurchaseInfo {
  /** 서점 검색에 넣는 말(책 제목 + 저자) */
  keyword: string;
  /** 협업 출판사 이름(선택) */
  publisher?: string;
  /** 출판사가 정한 상품 주소(선택). 있으면 검색 대신 이 주소로 간다. */
  url?: string;
}

export interface PurchaseLink {
  href: string;
  publisher?: string;
  /** true 면 서점 검색으로 가는 임시 연결 */
  temporary: boolean;
}

export const purchaseTable: Record<string, PurchaseInfo> = {
  zarathustra: { keyword: '차라투스트라는 이렇게 말했다 니체' },
  twilight: { keyword: '우상의 황혼 니체' },
  gwonhak: { keyword: '순자 권학' },
  seongak: { keyword: '순자 성악' },
};

const SEARCH_BASE = 'https://search.kyobobook.co.kr/search?keyword=';

export function getPurchaseLink(bookId: string): PurchaseLink | undefined {
  const info = purchaseTable[bookId];
  if (!info) return undefined;
  if (info.url) return { href: info.url, publisher: info.publisher, temporary: false };
  return { href: SEARCH_BASE + encodeURIComponent(info.keyword), publisher: info.publisher, temporary: true };
}
