export const STORAGE_KEY = 'hipdok.library.v1';
export const GENRES = ['문학', '철학', '에세이', '인문·사회', '기타'];
export const COLORS = ['#73547e', '#42655e', '#aa6b4f', '#626b91', '#b68b49', '#7b8b67'];
export const freshLibrary = () => ({ version: 1, nickname: '문장수집가', books: [] });
export function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function validateBook(book) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (typeof book.title !== 'string' || !book.title.trim() || book.title.length > 100) errors.title = '책 제목을 1~100자로 적어 주세요.';
  if (typeof book.author !== 'string' || !book.author.trim() || book.author.length > 80) errors.author = '저자를 1~80자로 적어 주세요.';
  if (!GENRES.includes(book.genre)) errors.genre = '장르를 선택해 주세요.';
  if (!validDay(book.finishedAt)) errors.finishedAt = '완독일을 올바르게 선택해 주세요.';
  if (typeof book.quote !== 'string' || book.quote.length > 500) errors.quote = '문장은 500자 이내로 적어 주세요.';
  if (typeof book.memo !== 'string' || book.memo.length > 3000) errors.memo = '감상은 3,000자 이내로 적어 주세요.';
  if (!/^#[0-9a-f]{6}$/i.test(book.color || '')) errors.color = '책 표지 색을 선택해 주세요.';
  if (book.editionId !== undefined && !['zarathustra-sasaek','genealogy-yeonam','beyond-good-evil-penguin'].includes(book.editionId)) errors.editionId = '지원하는 표지 판본을 선택해 주세요.';
  if (book.isReference) errors.isReference = '참고 도서는 완독일을 입력한 뒤 개인 기록으로 저장해 주세요.';
  return errors;
}
export function loadLibrary(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { data: freshLibrary(), error: '', blocked: false };
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || typeof data.nickname !== 'string' || !data.nickname.trim() || data.nickname.length > 30 || !Array.isArray(data.books)) throw Error('schema');
    const ids = new Set();
    for (const book of data.books) {
      if (!book || Object.keys(validateBook(book)).length || typeof book.id !== 'string' || !book.id || ids.has(book.id) || typeof book.createdAt !== 'string' || typeof book.updatedAt !== 'string') throw Error('book');
      ids.add(book.id);
    }
    return { data, error: '', blocked: false };
  } catch { return { data: freshLibrary(), error: '저장된 서고를 읽을 수 없어 원본 보존을 위해 저장을 중지했어요. 아래 백업 버튼으로 원본을 보관해 주세요.', blocked: true }; }
}
export function saveLibrary(storage, data) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
export function selectBooks(books, shelf = 'all', query = '', sort = 'recent') {
  const q = query.trim().toLocaleLowerCase();
  const result = books.filter(b => (shelf === 'all' || (shelf === 'quotes' ? !!b.quote.trim() : b.genre === shelf)) && `${b.title} ${b.author}`.toLocaleLowerCase().includes(q));
  return result.sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title, 'ko') : b.finishedAt.localeCompare(a.finishedAt) || b.createdAt.localeCompare(a.createdAt));
}
export function libraryStats(books) {
  return { total: books.length, quotes: books.filter(b => b.quote.trim()).length, authors: new Set(books.map(b => b.author.trim())).size };
}
export function mergeLegacy(current, legacy, catalog, now = new Date().toISOString()) {
  if (!legacy || legacy.version !== 1 || !legacy.profile || typeof legacy.profile.id !== 'string' || !Array.isArray(legacy.records)) throw Error('책사이 저장 형식이 올바르지 않아요.');
  const latest = new Map();
  for (const record of legacy.records) {
    if (!record || record.userId !== legacy.profile.id || typeof record.bookId !== 'string' || typeof record.createdAt !== 'string') continue;
    const old = latest.get(record.bookId);
    if (!old || old.createdAt < record.createdAt) latest.set(record.bookId, record);
  }
  const ids = new Set(current.map(b => b.id));
  const added = [];
  for (const [id, record] of latest) {
    const book = catalog.find(b => b.id === id);
    const importedId = `chaeksai:${legacy.profile.id}:${id}`;
    if (record.status !== 'finished' || !book || ids.has(importedId)) continue;
    const day = record.createdAt.slice(0,10);
    added.push({ id: importedId, title: book.subtitle, author: book.author, genre: '기타', finishedAt: validDay(day) ? day : now.slice(0,10), quote: typeof record.quote === 'string' ? record.quote.slice(0,500) : '', memo: typeof record.reason === 'string' ? record.reason.slice(0,3000) : '', color: COLORS[added.length % COLORS.length], createdAt: now, updatedAt: now });
  }
  return { books: [...current, ...added], count: added.length };
}
// 책사이의 입체 서고 바닥 경계 계산을 그대로 재사용합니다.
export function insideFloor(x,y) {
  const vertices = [[45.5,13],[92,44],[54.5,91],[8,54.5]];
  return vertices.every(([ax,ay],i) => { const [bx,by] = vertices[(i+1)%vertices.length]; return (bx-ax)*(y-ay)-(by-ay)*(x-ax)>=0; });
}
