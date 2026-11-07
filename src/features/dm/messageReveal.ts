// DM 도착 연출의 시간표. 저장 데이터와 무관한 순수 계산만 둔다.
export type RevealPhase = 'idle' | 'online' | 'typing';

export interface RevealStep {
  delay: number;
  count: number;
  phase: RevealPhase;
}

export type RevealLead = 'arrive' | 'answer';

/** 글이 길수록 오래 입력한다. 공백은 세지 않고 0.9~2초 안에 둔다. */
export function typingMs(text: string): number {
  const length = text.replace(/\s/g, '').length;
  return Math.min(2000, Math.max(900, 600 + 28 * length));
}

export function buildTimeline(texts: string[], lead: RevealLead): RevealStep[] {
  if (texts.length === 0) return [];
  const steps: RevealStep[] =
    lead === 'arrive'
      ? [
          { delay: 250, count: 0, phase: 'online' },
          { delay: 400, count: 0, phase: 'typing' },
        ]
      : [{ delay: 450, count: 0, phase: 'typing' }];
  texts.forEach((text, index) => {
    const count = index + 1;
    steps.push({ delay: typingMs(text), count, phase: 'online' });
    if (count < texts.length) steps.push({ delay: 450, count, phase: 'typing' });
  });
  steps.push({ delay: 200, count: texts.length, phase: 'idle' });
  return steps;
}
