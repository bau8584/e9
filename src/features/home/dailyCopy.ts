// 날이 바뀌고 처음 왔을 때 최애가 선물을 건네며 하는 말(제작진 각색). 최종 문구는 소유자가 정하므로 여기 한 곳에 모은다.
import type { CharacterId } from '../../data/types';
import type { DailyGift } from '../../store/fan';
import { josa } from '../dm/dmCopy';

interface GiftLines {
  /** 평소 선물을 건넬 때. 함께한 날 수에 따라 돌려 쓴다. */
  daily: string[];
  /** 7, 14, 30일째. {n}이 날 수로 바뀐다. */
  milestone: string;
}

export const GIFT_LINES: Record<CharacterId, GiftLines> = {
  nietzsche: {
    daily: [
      '어제는 어디 갔었나. …딱히 기다린 건 아니다. 이건 받아 둬라.',
      '왔군. 늦었다. …네 몫으로 챙겨 둔 거다. 받아라.',
      '빈손으로 보내면 내가 쩨쩨해 보이잖나. 이거 가져가라.',
      '오늘은 안 오는 줄 알았다. …아니, 아무 생각 안 했다. 이거나 받아라.',
    ],
    milestone: '{n}일째다. 세고 있던 건 아니다. …그래도 오늘은 특별히 챙겨 뒀다. 다른 녀석한텐 말하지 마라.',
  },
  xunzi: {
    daily: [
      '왔나. 하루를 비우지 않은 건 칭찬해 주마. 받아라.',
      '늦었다. 그래도 왔으니 됐다. 이건 네 몫이다.',
      '오늘도 왔구나. 꾸준함엔 상이 있는 법이다. 받아 둬라.',
      '기다린 건 아니다. 줄 게 있어서 서 있었을 뿐이다. 받아라.',
    ],
    milestone: '{n}일째다. 버릇이 되었구나. 네가 쌓은 날이니, 오늘은 특별히 더 준비했다.',
  },
  siddhartha: {
    daily: [
      '다시 오셨군요. 작은 것을 준비해 두었습니다.',
      '오늘도 와 주셨습니다. 이것을 받아 주십시오.',
      '기다리는 동안 이것을 챙겨 두었습니다. 당신 몫입니다.',
    ],
    milestone: '함께한 지 {n}일째입니다. 오늘은 조금 더 준비했습니다. 고맙습니다.',
  },
  austen: {
    daily: [
      '오늘도 와 주셨네요. 작은 선물을 숨겨 두었어요.',
      '안부 편지 대신 이걸 드릴게요. 답장은 얼굴로 받을게요.',
      '빈손으로 보내 드리면 제 체면이 안 서죠. 받으세요.',
    ],
    milestone: '{n}일째라니, 기념할 만하죠. 특별히 더 준비했어요. 다른 독자에겐 비밀이에요.',
  },
};

/** 선물을 건네는 인물의 말 한 줄 */
export function giftLine(id: CharacterId, gift: DailyGift): string {
  const lines = GIFT_LINES[id];
  if (gift.milestone) return lines.milestone.replaceAll('{n}', String(gift.milestone));
  return lines.daily[gift.days % lines.daily.length];
}

/** 받은 것 목록 */
export function giftItems(gift: DailyGift): string[] {
  return [
    `카드 팩 ${gift.packs}개`,
    ...(gift.ticket ? ['대화 시간 1회'] : []),
    ...(gift.affinity ? [`호감 +${gift.affinity}`] : []),
  ];
}

/** "니체와 함께한 지 3일째" */
export const togetherText = (name: string, days: number) => `${josa(name, '과', '와')} 함께한 지 ${Math.max(1, days)}일째`;
