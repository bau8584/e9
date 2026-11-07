import { useEffect, useRef } from 'react';
import { getCharacter, PLAYABLE_IDS } from '../data';
import { switchFavorite, useSnapshot } from '../store/store';
import { Portrait } from './Portrait';
import './character-switcher.css';

// 홈은 작가를 바꾸면 화면이 새로 만들어져 누른 칩의 초점이 사라진다. 새 칩으로 초점을 옮기려고 기억해 둔다.
let refocusAfterSwitch = false;

/** 함께 덕질하는 작가를 고르는 칩 줄. 작가가 2명 미만이면 보이지 않는다. */
export function CharacterSwitcher() {
  const currentId = useSnapshot().progress.favoriteId;
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!refocusAfterSwitch) return;
    refocusAfterSwitch = false;
    currentRef.current?.focus({ preventScroll: true });
  }, [currentId]);

  if (PLAYABLE_IDS.length < 2) return null;

  return (
    <nav className="character-switcher" aria-label="대화할 작가 고르기">
      {PLAYABLE_IDS.map((id) => {
        const character = getCharacter(id);
        const isCurrent = id === currentId;
        return (
          <button
            key={id}
            ref={isCurrent ? currentRef : undefined}
            type="button"
            className="character-chip"
            aria-pressed={isCurrent}
            onClick={() => {
              if (isCurrent) return;
              refocusAfterSwitch = true;
              switchFavorite(id);
            }}
          >
            {/* 이름을 바로 옆에 적으므로 초상 설명은 읽어 주지 않는다 */}
            <span aria-hidden="true">
              <Portrait character={character} className="character-chip-portrait" />
            </span>
            <span className="character-chip-name">{character.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
