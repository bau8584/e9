/** 스크립트로 만드는 움직임은 CSS의 동작 줄이기 규칙이 막지 못하므로 여기서 먼저 확인한다. 확인할 수 없는 환경이면 움직이지 않는다. */
export function motionOff(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
