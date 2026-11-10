// 수록한 책. 프로토타입은 일부 대목만 싣는다. 책마다 파일 하나.
import type { Book, Passage } from '../fanTypes';
import type { CharacterId } from '../types';
import { book as zarathustra } from './zarathustra';
import { book as twilight } from './twilight';
import { book as gwonhak } from './gwonhak';
import { book as seongak } from './seongak';

export const books: Book[] = [zarathustra, twilight, gwonhak, seongak];
export const booksOf = (id: CharacterId): Book[] => books.filter((b) => b.characterId === id);
export const getBook = (id: string): Book | undefined => books.find((b) => b.id === id);
export const getPassage = (id: string): Passage | undefined => books.flatMap((b) => b.passages).find((p) => p.id === id);
