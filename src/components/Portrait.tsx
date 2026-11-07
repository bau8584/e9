import nietzsche from '../assets/nietzsche.png';
import type { Character, CharacterId } from '../data';
import { ImageSlot } from './ImageSlot';

// 그림이 준비된 인물만 적는다. 나머지는 자리 표시(또는 public/images 파일).
const portraits: Partial<Record<CharacterId, string>> = { nietzsche };

export function Portrait({ character, className }: { character: Character; className?: string }) {
  return (
    <ImageSlot file={character.portraitFile} src={portraits[character.id]} alt={`${character.name} 초상`} className={`portrait ${className ?? ''}`}>
      <span className="monogram" aria-hidden="true">
        {character.monogram}
      </span>
    </ImageSlot>
  );
}
