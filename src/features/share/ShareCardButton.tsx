import { useState } from 'react';
import nietzsche from '../../assets/nietzsche.png';
import { getCharacter } from '../../data';
import type { FanCard } from '../../data/fanTypes';
import { useSnapshot } from '../../store/store';
import { renderShareImage, shareOrSave } from './shareImage';
import './share.css';

// Portrait.tsx 와 같은 규칙: 앱에 묶인 그림이 있으면 먼저, 없으면 public/images 의 인물 그림
const bundled: Record<string, string> = { nietzsche };

export function ShareCardButton({ card }: { card: FanCard }) {
  const { progress } = useSnapshot();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const ch = getCharacter(card.characterId);
      const nick = progress.nickname?.trim() || '나';
      const blob = await renderShareImage({
        rarity: card.rarity,
        tone: card.tone,
        title: card.title,
        scene: card.scene,
        line: card.line,
        owner: `${nick}의 카드`,
        portraitSrc: bundled[card.characterId] ?? `${import.meta.env.BASE_URL}images/${ch.portraitFile}`,
        monogram: ch.monogram,
      });
      const r = await shareOrSave(blob, `hipdok-${card.id}.png`, `${nick}의 카드 - HIP讀 힙독`);
      setNote(r === 'shared' ? '공유했어요' : r === 'saved' ? '그림으로 저장했어요' : '');
    } catch {
      setNote('그림을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share-card">
      <button type="button" className="btn share-card-btn" onClick={onClick} disabled={busy}>
        {busy ? '그림 만드는 중' : '카드 자랑하기'}
      </button>
      <span className="share-card-note" role="status" aria-live="polite">
        {note}
      </span>
    </div>
  );
}
