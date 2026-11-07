import { describe, expect, it } from 'vitest';
import { chatFor, questions, readingTypes, scoreAnswers } from './discoveryData';

describe('독서 취향 16유형', () => {
  it('모든 응답 조합이 유효한 유형에 도달하고 각 유형에 같은 수의 경로가 있다', () => {
    const counts = new Map<string, number>();
    for (let mask=0; mask<2**questions.length; mask++) {
      const result = scoreAnswers(questions.map((_,i)=>(mask>>i)&1));
      expect(result).not.toBeNull();
      counts.set(result!.code,(counts.get(result!.code)??0)+1);
    }
    expect([...counts.keys()].sort()).toEqual(readingTypes.map(t=>t.code).sort());
    expect([...counts.values()].every(n=>n===256)).toBe(true);
  });
  it('미응답과 잘못된 응답을 채점하지 않는다', () => {
    expect(scoreAnswers([])).toBeNull();
    expect(scoreAnswers(Array(12).fill(-1))).toBeNull();
    expect(scoreAnswers(Array(13).fill(0))).toBeNull();
  });
  it('선택지의 순서가 뒤집힌 문항도 해당 축에 맞게 계산한다', () => {
    expect(scoreAnswers([0,1,0,1,1,0,1,0,0,0,0,1])?.code).toBe('IPSB');
    expect(scoreAnswers([1,0,1,0,0,1,0,1,1,1,1,0])?.code).toBe('WQCR');
  });
  it('8유형씩 니체와 순자로만 연결하며 소개 철학자는 16명이다', () => {
    expect(new Set(readingTypes.map(t=>t.philosopher)).size).toBe(16);
    expect(readingTypes.filter(t=>chatFor(t.code)==='xunzi')).toHaveLength(8);
    expect(readingTypes.filter(t=>chatFor(t.code)==='nietzsche')).toHaveLength(8);
    expect(readingTypes.filter(t=>t.contrast).map(t=>t.philosopher)).toEqual(['맹자','노자']);
  });
});
