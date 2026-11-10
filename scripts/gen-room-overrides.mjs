// room.css, style.css 원본을 고치지 않고 내 방을 앱 색과 글자 크기에 맞추는 덮어쓰기 파일을 만든다.
// 12px보다 작은 글자는 12px로, 연보라 글자와 면은 앱의 중립색으로. 원본이 바뀌면 다시 실행한다.
// 실행: node scripts/gen-room-overrides.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import postcss from 'postcss';

// 책 표지와 방 그림 안의 장식 글자는 크기를 키우면 그림이 깨지므로 뺀다.
const KEEP = /personal-cover|cover-|actual-cover|wall-mark|mini-room|shelf-label|map-|player|sofa|talk-table|form-book-preview/;
const MUTED = '#625a6c';
const SOFT_FACE = '#f6efdf';

function rgb(hex) {
  const h = hex.slice(1);
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
function isLilac(hex) {
  const [r, g, b] = rgb(hex);
  return b >= g && r >= g && b - g >= 6 && (r + g + b) / 3 > 110;
}

const small = new Set();
const lilacText = new Set();
const lilacFace = new Set();
for (const file of ['src/room.css', 'src/style.css']) {
  postcss.parse(readFileSync(file, 'utf8')).walkRules((rule) => {
    if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
    const selectors = rule.selectors.filter((s) => !KEEP.test(s) && !/:root|^html|^body/.test(s));
    if (!selectors.length) return;
    rule.walkDecls((d) => {
      const size = d.prop === 'font-size' ? d.value : d.prop === 'font' ? d.value.match(/\b(\d+(?:\.\d+)?)px/)?.[0] : null;
      if (size && /px$/.test(size) && parseFloat(size) < 12) selectors.forEach((s) => small.add(s));
      if (d.prop === 'color' && /^#[0-9a-f]{3,8}$/i.test(d.value) && isLilac(d.value)) selectors.forEach((s) => lilacText.add(s));
      if (/^background(-color)?$/.test(d.prop) && /^#[0-9a-f]{3,8}$/i.test(d.value) && isLilac(d.value)) selectors.forEach((s) => lilacFace.add(s));
    });
  });
}

const block = (set, body) => (set.size ? `${[...set].sort().join(',\n')} { ${body} }\n` : '');
writeFileSync(
  'src/features/my-room/room-overrides.css',
  '/* 만든 곳: scripts/gen-room-overrides.mjs. 직접 고치지 말고 다시 실행한다. */\n' +
    block(lilacFace, `background: ${SOFT_FACE};`) +
    block(lilacText, `color: ${MUTED};`) +
    block(small, 'font-size: 12px !important;') +
    '.collection-card, .side-room-note { background: #fffdf7; }\n.big-count { color: #4b1f78; }\n' +
    '/* 방 그림 위 이름표. 그림과 겹치지 않는 선에서 키운다. */\n.shelf-label, .shelf-label b, .player-name, .player-name > span, .map-controls span, .map-legend, .map-coordinate { font-size: 10px !important; }\n' +
    '/* 방(지도)에 키보드 초점이 있을 때만 걷는다. 초점 표시. */\n.map:focus-visible { outline: 3px solid #4b1f78; outline-offset: 2px; }\n' +
    '/* 터치 기기에서는 키보드 안내를 숨긴다. 화면 방향 버튼(.mobile-dpad)은 그대로. */\n@media (hover: none) and (pointer: coarse) {\n  .map-controls > div, .near-hint kbd { display: none; }\n}\n',
);
console.log(`글자 ${small.size}, 글자색 ${lilacText.size}, 면 ${lilacFace.size}`);
