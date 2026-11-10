import { useEffect, useMemo, useState } from 'react';
import { buildTimeline, type RevealLead, type RevealPhase, type RevealStep } from './messageReveal';

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * 말풍선을 시간표대로 하나씩 보여 준다. 진행 상태는 화면 메모리에만 있다.
 * 보여 줄 글 묶음이 바뀌면(선택 대화의 다음 장면) 처음부터 다시 재생한다.
 */
export function useMessageReveal(texts: string[], play: boolean, lead: RevealLead) {
  const timeline = useMemo(() => (play ? buildTimeline(texts, lead) : []), [play, lead, texts]);
  const [track, setTrack] = useState<{ timeline: RevealStep[]; step: number; skipped: boolean }>({ timeline, step: 0, skipped: false });
  let { step, skipped } = track;
  if (track.timeline !== timeline) {
    step = 0;
    skipped = false;
    setTrack({ timeline, step: 0, skipped: false });
  }
  const done = !play || skipped || step >= timeline.length;

  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(
      () => setTrack((current) => (current.timeline === timeline ? { ...current, step: current.step + 1 } : current)),
      timeline[step].delay,
    );
    return () => window.clearTimeout(timer);
  }, [done, step, timeline]);

  const current = step > 0 ? timeline[step - 1] : undefined;
  const visibleCount = done ? texts.length : (current?.count ?? 0);
  const phase: RevealPhase = done ? 'idle' : (current?.phase ?? 'idle');
  return { visibleCount, phase, done, skip: () => setTrack((t) => ({ ...t, skipped: true })) };
}
