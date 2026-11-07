import { useEffect, useMemo, useState } from 'react';
import { buildTimeline, type RevealLead, type RevealPhase } from './messageReveal';

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** 말풍선을 시간표대로 하나씩 보여 준다. 진행 상태는 화면 메모리에만 있다. */
export function useMessageReveal(texts: string[], play: boolean, lead: RevealLead) {
  const timeline = useMemo(() => (play ? buildTimeline(texts, lead) : []), [play, lead, texts]);
  const [step, setStep] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const done = !play || skipped || step >= timeline.length;

  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), timeline[step].delay);
    return () => window.clearTimeout(timer);
  }, [done, step, timeline]);

  const current = step > 0 ? timeline[step - 1] : undefined;
  const visibleCount = done ? texts.length : (current?.count ?? 0);
  const phase: RevealPhase = done ? 'idle' : (current?.phase ?? 'idle');
  return { visibleCount, phase, done, skip: () => setSkipped(true) };
}
