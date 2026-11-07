import type { ExampleRanking } from './types';

// 이번 주 팬덤 순위의 "예시 점수". 실제 사용자 집계가 아니다.
// 어떤 최애를 골라도 시연에서 순위가 오르는 모습이 보이도록,
// 고른 최애가 2위에서 시작해 미션 한 번(+20점)으로 1위가 되게 맞춰 두었다.
export const exampleRanking: ExampleRanking = {
  siddhartha: { nietzsche: 1240, siddhartha: 1230, austen: 1205, xunzi: 1180 },
  nietzsche: { austen: 1240, nietzsche: 1230, xunzi: 1205, siddhartha: 1180 },
  austen: { nietzsche: 1240, austen: 1230, siddhartha: 1205, xunzi: 1180 },
  xunzi: { nietzsche: 1240, xunzi: 1230, austen: 1205, siddhartha: 1180 },
};
