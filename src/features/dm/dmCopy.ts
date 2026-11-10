// DM 화면 글 모음. 최종 문구는 소유자가 정하므로 고칠 곳을 여기 한 곳에 모은다.
// 인물 대사(기억 언급)는 제작진 각색이다.
import type { CharacterId } from '../../data/types';

/** 받침이 있으면 앞 조사, 없으면 뒤 조사. 한글이 아니면 "와(과)"처럼 둘 다 적는다. */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}${withoutFinal}(${withFinal})`;
  return `${word}${code % 28 ? withFinal : withoutFinal}`;
}

export const DM_COPY = {
  // 대화 목록
  listTitle: '대화',
  newTag: '새 메시지',
  newCta: '대화 열기',
  doneTag: '다시 보기',
  lockedTag: '더 가까워지면 열려요',
  emptyList: '아직 준비 중인 대화예요.',
  allDone: '지금 열린 대화는 다 나눴어요. 더 가까워지면 새 대화가 열려요.',
  backToList: '대화 목록으로',
  replyLabel: '답장 고르기',
  skip: '바로 보기',
  replayDifferent: '다르게 답해 보기',
  readRecommend: (title: string) => `'${title}' 읽으러 가기`,

  // 보상
  rewardTitle: '받은 것',
  rewardAffinity: (n: number) => `호감 +${n}`,
  rewardPack: '카드 팩 1개',
  rewardTicket: '대화 시간 1회',
  rewardTicketFull: '대화 시간은 이미 가득 차 있어요',

  // 대화 시간(자유대화)
  timeTitle: '대화 시간',
  timeReady: (name: string, n: number) => `지금 ${josa(name, '과', '와')} 직접 이야기할 수 있어요 · 남은 대화 시간 ${n}`,
  timeEmpty: '대목 하나를 읽거나 대화 한 편을 끝내면 다시 시간을 내 줘요',
  goReading: '대목 읽으러 가기',
  goEpisode: '대화 한 편 나누기',
  start: '대화 시작하기',
  finish: '대화 마치기',
  close: '닫기',
  send: '보내기',
  turnsLeft: (n: number) => `남은 말 ${n}번`,
  timeUsedNote: '첫 말을 보내고 답이 오면 대화 시간 1회를 써요.',
  timeOver: (name: string) => `${josa(name, '과', '와')}의 대화 시간이 끝났어요.`,
  noTicketError: '남은 대화 시간이 없어요.',
  placeholder: (name: string) => `${name}에게 직접 말해 보세요`,
  topicLabel: (title: string) => `방금 읽은 '${title}' 이야기`,
  // 서버에 닿지 못했을 때. 실패한 말은 대화 시간과 남은 말 수에서 빠지지 않는다.
  serverError: '지금 대화가 잘 이어지지 않아요. 잠시 뒤 다시 보내 주세요.',
  // 개인정보 안내(기존 문구 유지)
  notice:
    '실제 인물이 아니라 AI가 재구성한 캐릭터예요. 보낸 말은 답을 만들기 위해 처리되며 힙독 서버에는 저장하지 않아요. 이름이나 연락처 같은 개인정보는 적지 말아 주세요. 대화는 탭을 닫으면 사라져요.',
  noteSummary: '왜 이런 말을 할까?',
};

/** 자유대화를 열 때 인물이 지난 대화를 한 번 떠올리는 말(각색). {memory}가 사용자가 했던 말로 바뀐다. */
export const MEMORY_LINES: Record<CharacterId, string> = {
  nietzsche: '지난번에 네가 "{memory}"라고 했지. 그 말이 아직 머리에 남아 있다.',
  xunzi: '지난번에 "{memory}"라고 했었지. 그 말을 몇 번 곱씹어 보았다.',
  siddhartha: '지난번에 "{memory}"라고 하셨지요. 그 말을 오래 생각했습니다.',
  austen: '지난번에 "{memory}"라고 하셨던 것, 저는 잊지 않았답니다.',
};

/** 기억 한 줄은 내가 처음 보낸 말을 이 길이로 자른다. */
export const MEMORY_CHARS = 40;
