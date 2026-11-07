// CSS 충돌을 막는다. 희경 선생님의 room.css, style.css 와 입덕 쪽 CSS 는 같은 이름(.tag, .brand 등)을 쓰므로
// 원본은 고치지 않고 빌드 때 각각 .my-room-scope, .fandom-scope 안으로 묶는다.
// src/styles/global.css 만 묶지 않는다.
const scopeOf = (file = '') => {
  const f = file.replaceAll('\\', '/');
  if (!f.includes('/src/') || f.endsWith('/src/styles/global.css')) return null;
  if (/\/src\/(room|style)\.css/.test(f) || f.includes('/src/features/my-room/')) return '.my-room-scope';
  return '.fandom-scope';
};
const prefix = (selector, scope) => {
  const s = selector.trim();
  if (/^(:root|html|body)$/.test(s)) return scope;
  return scope + ' ' + s;
};
export const scopeCss = () => ({
  postcssPlugin: 'hipdok-scope-css',
  Once(root) {
    const scope = scopeOf(root.source?.input?.file);
    if (!scope) return;
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
      rule.selectors = rule.selectors.map((s) => prefix(s, scope));
    });
  },
});
