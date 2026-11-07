import nietzsche from '../assets/nietzsche.png';
import type { Character, CharacterId } from '../data';
import { ImageSlot } from './ImageSlot';

// 앱에 묶인 그림이 있는 인물. 여기 있으면 public/images 의 같은 이름 파일보다 먼저 쓴다(지금은 니체).
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
