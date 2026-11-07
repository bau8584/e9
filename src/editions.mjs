// 사용자가 이전에 찾아 둔 표지와 동일한 판본입니다. 확인일: 2026-11-07.
export const NIETZSCHE_EDITIONS = [
  {
    id: 'zarathustra-sasaek', title: '차라투스트라는 이렇게 말했다', author: '프리드리히 니체',
    publisher: '사색의숲', language: '한국어판', color: '#2447c0',
    sourceLabel: 'YES24', sourceUrl: 'https://www.yes24.com/product/goods/109178145',
    imageUrl: 'https://image.yes24.com/goods/109178145/XL',
    aliases: ['차라투스트라는 이렇게 말했다'],
  },
  {
    id: 'genealogy-yeonam', title: '도덕의 계보학', author: '프리드리히 니체',
    publisher: '연암서가', language: '한국어판', color: '#ac322d',
    sourceLabel: '교보문고', sourceUrl: 'https://ebook-product.kyobobook.co.kr/dig/epd/sam/E000003225795',
    imageUrl: 'https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/9788994054193.jpg',
    aliases: ['도덕의 계보학', '도덕의 계보'],
  },
  {
    id: 'beyond-good-evil-penguin', title: '선악의 저편 (영문판)', author: '프리드리히 니체',
    publisher: 'Penguin Books', language: '영문판', color: '#29434c',
    sourceLabel: 'Apple Books', sourceUrl: 'https://books.apple.com/us/book/beyond-good-and-evil/id374216200',
    imageUrl: 'https://cdn.penguin.co.uk/dam-assets/books/9780141902630/9780141902630-jacket-large.jpg',
    imageSourceUrl: 'https://www.penguin.co.uk/books/35479/beyond-good-and-evil-by-nietzsche-friedrich/9780141902630',
    referenceImageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Publication128/v4/1d/3a/3e/1d3a3e02-0687-2e7e-f3ba-d29d785eb49a/9780141902630.jpg/1200x1200wz.jpg',
    aliases: ['선악의 저편', '선악의 저편 (영문판)', 'Beyond Good and Evil'],
  },
];
const normalize = value => String(value || '').normalize('NFKC').replace(/[\s·.,()（）]/g, '').toLowerCase();
export function findEdition(book) {
  const author = normalize(book.author);
  if (!['프리드리히니체', '프리드리히빌헬름니체', '니체', 'friedrichnietzsche', 'friedrichwilhelmnietzsche'].includes(author)) return undefined;
  const title = normalize(book.title);
  return NIETZSCHE_EDITIONS.find(edition => (!book.editionId || book.editionId === edition.id) && edition.aliases.some(alias => normalize(alias) === title));
}
