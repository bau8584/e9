// 자랑용 그림(세로 1080x1350 PNG)을 canvas로 직접 그린다. 독서 MBTI 결과 공유에도 쓸 수 있게 카드와 무관하게 만든다.
export const SHARE_W = 1080;
export const SHARE_H = 1350;

export interface ShareImageSpec {
  /** 등급 글자(예: 희귀). 틀 색을 정한다 */
  rarity: string;
  /** 0~3 배경 색감 */
  tone: number;
  title: string;
  scene: string;
  line: string;
  /** 윗줄 문구(예: "달이의 카드") */
  owner: string;
  /** 초상 그림 주소. 못 불러오면 monogram 을 그린다 */
  portraitSrc?: string;
  monogram: string;
}

const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', 'Batang', 'AppleMyungjo', serif";

const rarityFrame: Record<string, { frame: string; glow: string }> = {
  일반: { frame: '#b9b2c4', glow: '#ffffff' },
  희귀: { frame: '#4f8fd8', glow: '#cfe3ff' },
  초희귀: { frame: '#8a4fd8', glow: '#e3cfff' },
  한정: { frame: '#d9a62e', glow: '#fff0c2' },
};
const toneBg: [string, string][] = [
  ['#2a1747', '#4b1f78'],
  ['#142a47', '#1f4b78'],
  ['#3d1730', '#78204f'],
  ['#17382f', '#1f7860'],
];

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of Array.from(text)) {
    if (ch === '\n') {
      lines.push(cur);
      cur = '';
      continue;
    }
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch.trim() === '' ? '' : ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].replace(/.$/, '…');
    return cut;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareImage(spec: ShareImageSpec): Promise<Blob> {
  try {
    await document.fonts?.load(`700 40px ${SERIF}`);
  } catch {
    /* 글꼴을 못 기다려도 그린다 */
  }
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_W;
  canvas.height = SHARE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 를 쓸 수 없어요');

  const f = rarityFrame[spec.rarity] ?? rarityFrame['일반'];
  const [c1, c2] = toneBg[((spec.tone % 4) + 4) % 4];
  const bg = ctx.createLinearGradient(0, 0, SHARE_W, SHARE_H);
  bg.addColorStop(0, c1);
  bg.addColorStop(1, c2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);
  const glow = ctx.createRadialGradient(SHARE_W / 2, 560, 60, SHARE_W / 2, 560, 700);
  glow.addColorStop(0, f.glow + '55');
  glow.addColorStop(1, f.glow + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffffcc';
  ctx.font = `700 40px ${SERIF}`;
  ctx.fillText(spec.owner, SHARE_W / 2, 100);

  // 카드 틀
  const cx = 130;
  const cy = 140;
  const cw = 820;
  const ch = 900;
  ctx.fillStyle = '#faf5e9';
  roundRect(ctx, cx, cy, cw, ch, 36);
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = f.frame;
  ctx.stroke();

  // 초상
  const px = cx + 40;
  const py = cy + 40;
  const pw = cw - 80;
  const ph = 520;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 20);
  ctx.clip();
  const pg = ctx.createLinearGradient(px, py, px + pw, py + ph);
  pg.addColorStop(0, c1);
  pg.addColorStop(1, c2);
  ctx.fillStyle = pg;
  ctx.fillRect(px, py, pw, ph);
  const img = spec.portraitSrc ? await loadImage(spec.portraitSrc) : null;
  if (img && img.width && img.height) {
    const s = Math.max(pw / img.width, ph / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, px + (pw - w) / 2, py + (ph - h) * 0.15, w, h);
  } else {
    ctx.fillStyle = '#ffffffdd';
    ctx.font = `700 260px ${SERIF}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.monogram, px + pw / 2, py + ph / 2);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();

  // 등급 띠
  ctx.fillStyle = f.frame;
  roundRect(ctx, px + 20, py + 20, 150, 52, 26);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 28px ${SERIF}`;
  ctx.fillText(spec.rarity, px + 95, py + 57);

  // 글
  ctx.fillStyle = '#241b2e';
  ctx.font = `700 52px ${SERIF}`;
  let y = py + ph + 80;
  for (const l of wrap(ctx, spec.title, cw - 100, 2)) {
    ctx.fillText(l, cx + cw / 2, y);
    y += 62;
  }
  ctx.fillStyle = '#6b5a7a';
  ctx.font = `400 30px ${SERIF}`;
  for (const l of wrap(ctx, spec.scene, cw - 100, 1)) {
    ctx.fillText(l, cx + cw / 2, y);
    y += 44;
  }
  y += 14;
  ctx.fillStyle = '#4b1f78';
  ctx.font = `700 34px ${SERIF}`;
  for (const l of wrap(ctx, `“${spec.line}”`, cw - 120, 3)) {
    ctx.fillText(l, cx + cw / 2, y);
    y += 48;
  }

  // 아래 표시
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 64px ${SERIF}`;
  ctx.fillText('HIP讀 힙독', SHARE_W / 2, 1215);
  ctx.fillStyle = '#ffffffaa';
  ctx.font = `400 28px ${SERIF}`;
  ctx.fillText('인물 대사는 제작진 각색이에요', SHARE_W / 2, 1270);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('그림을 만들지 못했어요'))), 'image/png');
  });
}

export type ShareResult = 'shared' | 'saved' | 'cancelled';

/** 휴대폰이면 공유 창, 안 되면 내려받기 */
export async function shareOrSave(blob: Blob, fileName: string, text: string): Promise<ShareResult> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // 그 밖의 실패는 내려받기로 넘어간다
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'saved';
}
