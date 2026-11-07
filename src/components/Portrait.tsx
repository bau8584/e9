import { useState } from 'react';
import nietzsche from '../assets/nietzsche.png';
import type { Character, CharacterId } from '../data';
import { ImageSlot } from './ImageSlot';

// 앱에 묶인 그림이 있는 인물. 여기 있으면 public/images 의 같은 이름 파일보다 먼저 쓴다(지금은 니체).
const portraits: Partial<Record<CharacterId, string>> = { nietzsche };

interface Props {
  character: Character;
  className?: string;
  /** 관계 단계. 1 이상이면 portrait-인물-stage단계.png 를 먼저 찾고, 없으면 기본 초상을 쓴다. */
  stage?: number;
}

export function Portrait({ character, className, stage = 0 }: Props) {
  const stageFile = stage > 0 ? `portrait-${character.id}-stage${stage}.png` : null;
  const [missingFile, setMissingFile] = useState<string | null>(null);
  const useStage = stageFile !== null && stageFile !== missingFile;
  const bundled = useStage ? undefined : portraits[character.id];
  const file = useStage ? stageFile : character.portraitFile;
  return (
    <ImageSlot
      key={bundled ?? file}
      file={file}
      src={bundled}
      alt={`${character.name} 초상`}
      className={`portrait ${bundled ? 'portrait-wide' : ''} ${className ?? ''}`}
      onMissing={useStage ? () => setMissingFile(stageFile) : undefined}
    >
      <span className="monogram" aria-hidden="true">
        {character.monogram}
      </span>
    </ImageSlot>
  );
}
