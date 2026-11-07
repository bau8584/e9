export type ChatId = 'xunzi' | 'nietzsche';
export interface ReadingType { code: string; name: string; philosopher: string; description: string; topic: string; prompt: string; contrast?: boolean }
export const questions = [
  { text: '지금 서점에서 더 끌리는 제목은?', options: ['나는 왜 내가 원하는 걸 모를까?', '우리는 왜 함께 살면서 자꾸 싸울까?'], axis: 0, values: ['I', 'W'] },
  { text: '책을 덮었을 때 더 얻고 싶은 것은?', options: ['한동안 곱씹어볼 질문 하나.', '오늘 바로 해볼 행동 하나.'], axis: 1, values: ['Q', 'P'] },
  { text: '어려운 생각, 어떻게 설명해주면 좋을까?', options: ['먼저 일상 속 장면으로 보여줘.', '핵심 개념과 논리부터 알려줘.'], axis: 2, values: ['S', 'C'] },
  { text: '요즘 내게 더 필요한 책은?', options: ['당연하게 믿던 기준을 다시 보게 하는 책.', '지키고 싶은 기준을 단단하게 만드는 책.'], axis: 3, values: ['R', 'B'] },
  { text: '소설을 읽고 친구와 이야기한다면?', options: ['이 사람들이 사는 사회는 왜 이렇게 굴러갈까?', '내가 주인공이라면 어떤 선택을 했을까?'], axis: 0, values: ['W', 'I'] },
  { text: '참여하고 싶은 철학 독서 모임은?', options: ['배운 걸 일주일 살아보며 써먹는 모임.', '한 문장을 붙잡고 끝까지 따져보는 모임.'], axis: 1, values: ['P', 'Q'] },
  { text: '다음 중 더 술술 읽히는 쪽은?', options: ['개념을 차근차근 구분하며 설명하는 글.', '인물과 사건을 따라가며 생각하게 하는 글.'], axis: 2, values: ['C', 'S'] },
  { text: '책 속 주장에 끄덕였다. 다음으로 궁금한 건?', options: ['이 기준을 어떻게 꾸준히 지켜볼까?', '이 기준이 안 맞는 경우도 있지 않을까?'], axis: 3, values: ['B', 'R'] },
  { text: '철학자에게 먼저 묻고 싶은 것은?', options: ['내 삶은 누구 기준으로 정하면 좋을까요?', '함께 살 때 어떤 약속이 필요할까요?'], axis: 0, values: ['I', 'W'] },
  { text: '마지막 장에 어떤 보너스가 있으면 좋을까?', options: ['오늘부터 해볼 작은 실천.', '정답이 딱 떨어지지 않는 생각거리.'], axis: 1, values: ['P', 'Q'] },
  { text: '더 읽고 싶은 목차는?', options: ['친구의 성공이 배 아플 때.', '질투는 어떤 감정이며 어떻게 판단할까.'], axis: 2, values: ['S', 'C'] },
  { text: '지금 내 책장의 빈자리는?', options: ['익숙한 생각을 흔드는 새로운 관점.', '흔들릴 때 돌아갈 나만의 원칙.'], axis: 3, values: ['R', 'B'] },
] as const;

export const readingTypes: ReadingType[] = [
  { code:'IPSB', name:'내일부터 인간 졸업생', philosopher:'순자', description:'결심은 이미 베스트셀러인데 실행은 아직 초판 인쇄 중. 멋진 말보다 내일의 행동을 바꾸는 책에 손이 가요.', topic:'욕망을 그대로 따르면 다툼이 생기기에, 배움과 예의, 의식적인 실천으로 선을 길러야 한다는 생각.', prompt:'알면서도 미루는 버릇, 어떻게 바꿀까요?' },
  { code:'IPSR', name:'인생 선택지 추가러', philosopher:'사르트르', description:'“원래 이렇게 사는 거야”라는 말에 다른 선택지를 찾아봐요. 다음 장은 조금 다르게 써보고 싶어요.', topic:'주어진 상황 속에서도 이루어지는 선택과 책임.', prompt:'남이 정해준 역할대로만 살고 있는 것 같아요.' },
  { code:'IPCB', name:'생활 개선 연구소장', philosopher:'아리스토텔레스', description:'감명은 받았고, 그래서 어디에 적용하죠? 좋은 생각을 일상의 반복되는 선택에 써볼 때 가장 신나요.', topic:'좋은 삶을 이루는 덕과 습관, 실천적 판단.', prompt:'좋은 행동이 자연스러워지려면 어떻게 연습하죠?' },
  { code:'IPCR', name:'인생 설명서 재작성러', philosopher:'니체', description:'남들이 좋다는 삶에도 “왜요?” 버튼이 보여요. 남이 준 설명서보다 직접 고쳐 쓰는 설명서에 끌려요.', topic:'물려받은 가치를 검토하고 자신을 넘어서는 자기극복.', prompt:'남들이 좋다는 삶 말고, 내 기준은 어떻게 세우죠?' },
  { code:'IQSB', name:'소확행 확대경 수집가', philosopher:'에피쿠로스', description:'거창한 성공담보다 조용히 만족하는 하루가 궁금해요. 좋은 책과 편한 자리가 있으면 일단 출발 가능.', topic:'욕망을 구분하고 소박한 즐거움과 평온을 찾는 삶.', prompt:'갖고 싶은 게 끝이 없을 때는 어떻게 해야 할까요?' },
  { code:'IQSR', name:'의미 없어도 다음 장', philosopher:'카뮈', description:'깔끔한 해피엔딩보다 답 없는 상황을 살아내는 이야기에 끌려요. 찜찜한 결말도 오래 기억해요.', topic:'의미를 찾는 인간과 세계 사이의 부조리, 그럼에도 살아가는 태도.', prompt:'삶의 정답이 없다면 뭘 보고 살아가면 좋을까요?' },
  { code:'IQCB', name:'마음의 권한 관리자', philosopher:'에픽테토스', description:'걱정이 찾아오면 일단 담당 부서부터 확인해요. 머릿속 알림을 전부 긴급으로 처리하고 싶지는 않아요.', topic:'우리에게 달린 것과 달리지 않은 것, 판단과 태도의 훈련.', prompt:'감정이 올라오는 것과 행동하는 건 어떻게 구분하죠?' },
  { code:'IQCR', name:'의심 버튼 과다 클릭러', philosopher:'데카르트', description:'다들 당연하다고 할수록 오히려 궁금해져요. 책에는 밑줄보다 물음표가 먼저 생길지도 몰라요.', topic:'확실한 앎을 찾기 위해 믿음의 근거를 검토하는 방법적 의심.', prompt:'당연하다고 믿는 생각부터 의심해도 괜찮을까요?' },
  { code:'WPSB', name:'단톡방 평화 유지반', philosopher:'공자', description:'말 잘하는 법만큼 잘 듣고 함께 사는 법도 궁금해요. 단체 모임 뒤풀이에는 할 말이 꽤 많아요.', topic:'관계 속에서의 인과 예, 배움을 통한 수양.', prompt:'내 욕심과 다른 사람에 대한 배려는 어떻게 조절하죠?' },
  { code:'WPSR', name:'남의 대본 반납러', philosopher:'보부아르', description:'“너는 이래야 해”라는 말에 대본 작성자가 궁금해져요. 내 역할도 남의 역할도 정해진 채로 받아들이고 싶지 않죠.', topic:'주어진 역할과 억압, 상황 속 자유와 타인의 자유.', prompt:'사람들이 기대하는 모습에서 벗어나면 이기적인 걸까요?' },
  { code:'WPCB', name:'양심 사용설명서 정독러', philosopher:'칸트', description:'나만 이득이면 되는 선택에는 작은 경고등이 켜져요. 예외 조항이 많은 변명보다 분명한 이유가 좋아요.', topic:'의무와 보편화할 수 있는 도덕적 원칙.', prompt:'내게 유리한 선택과 옳은 선택이 다르면 어떡하죠?' },
  { code:'WPCR', name:'세상 기본설정 편집자', philosopher:'아렌트', description:'불편한 일을 개인의 성격 탓만으로 끝내기 어려워요. 누가 정했고 누구에게 유리한 규칙인지 궁금하죠.', topic:'공적 공간에서의 말과 행위, 판단과 함께 사는 세계.', prompt:'다들 당연하다는 규칙을 나만 불편해하면 어떡하죠?' },
  { code:'WQSB', name:'선한 마음 발굴단', philosopher:'맹자', description:'사람에게 실망해도 작은 선의를 그냥 넘기지는 못해요. 냉소가 정답이라기엔 아직 읽을 이야기가 많아요.', topic:'선한 본성과 도덕적 마음의 싹을 기르는 일.', prompt:'선한 행동을 하는 사람도 있는데 본성이 악하다고요?', contrast:true },
  { code:'WQSR', name:'쓸모없음 명예회원', philosopher:'장자', description:'모든 것에 성과표를 붙이는 세상이 조금 답답해요. 책을 읽다 옆길로 새는 순간도 꽤 좋아해요.', topic:'고정된 관점과 쓸모의 기준을 흔드는 이야기.', prompt:'꼭 쓸모를 증명해야 가치 있는 사람인가요?' },
  { code:'WQCB', name:'힘 빼기 설계자', philosopher:'노자', description:'더 세게 밀기 전에 흐름부터 살펴보고 싶어요. 덜 억지 부리면서 함께 사는 방법이 궁금해요.', topic:'무위와 자연스러움, 지나친 강제를 줄이는 삶.', prompt:'규칙을 더 만들면 정말 다툼이 줄어들까요?', contrast:true },
  { code:'WQCR', name:'물음표 무한 리필러', philosopher:'소크라테스', description:'독서 모임에서 “정의가 뭔데?”를 꺼낼 가능성이 있어요. 책을 다 읽었는데 질문은 더 늘어나는 편.', topic:'대화를 통해 안다고 믿는 것과 말의 뜻을 검토하기.', prompt:'좋은 삶이 뭔지, 처음부터 다시 물어봐도 될까요?' },
];

export const chatFor = (code: string): ChatId => code.endsWith('B') ? 'xunzi' : 'nietzsche';
export function scoreAnswers(answers: readonly number[]): ReadingType | null {
  if (answers.length !== questions.length || answers.some(a => a !== 0 && a !== 1)) return null;
  const axes: Record<string, number>[] = [{I:0,W:0},{P:0,Q:0},{S:0,C:0},{B:0,R:0}];
  questions.forEach((q,i) => axes[q.axis][q.values[answers[i]] as string]++);
  const code = axes.map(axis => Object.keys(axis).reduce((a,b) => axis[a] > axis[b] ? a : b)).join('');
  return readingTypes.find(t => t.code === code) ?? null;
}
export function typeLabels(code: string) {
  const labels: Record<string,string> = {I:'나의 삶',W:'함께 사는 세계',P:'실천',Q:'탐구',S:'장면',C:'개념',B:'기준 다지기',R:'기준 다시 보기'};
  return code.split('').map(c => labels[c]);
}
export const RESULT_KEY = 'hipdok:reading-taste:v1';
export function readResult(): ReadingType | null {
  try { return readingTypes.find(t => t.code === localStorage.getItem(RESULT_KEY)) ?? null; } catch { return null; }
}
