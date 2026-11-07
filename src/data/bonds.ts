import type { CharacterId } from './types';

// 호감도 단계별 관계 문구. 전부 제작진이 지어낸 각색이며 인물의 실제 발언이 아니다.
// 싯다르타는 더 다정해질 뿐 친한 척하거나 망가지지 않는다. 연애와 니체의 병은 소재로 쓰지 않는다.
// {name}은 닉네임, {book}은 사용자가 가장 최근에 등록한 책 제목으로 바뀐다.
export interface BondStage {
  /** 홈과 DM에 보이는 관계 이름 */
  title: string;
  /** 지금 관계가 어떤 사이인지 한 줄로 */
  description: string;
  /** 홈에서 최애가 건네는 한마디 */
  greeting: string;
  /** DM을 열 때 이 단계에서만 먼저 건네는 말. 0단계는 없다. */
  opener?: string;
  /** 가장 최근 등록한 책에 대한 반응 */
  bookReaction: string;
  /** 이 단계에 오를 때 한 번 나오는 대사. 0단계는 비어 있다. */
  moment: string[];
}

export const bonds: Record<CharacterId, BondStage[]> = {
  siddhartha: [
    {
      title: '싯다르타 팬',
      description: '당신을 조용히 지켜보는 사이입니다.',
      greeting: '오셨군요. 서두르지 않아도 됩니다.',
      bookReaction: '곁에 두신 『{book}』, 천천히 읽으세요.',
      moment: [],
    },
    {
      title: '곁에 앉은 이',
      description: '이름을 불러 주고 안부를 묻는 사이입니다.',
      greeting: '{name} 님, 숨은 고르셨습니까.',
      opener: '{name} 님, 다시 뵙습니다.',
      bookReaction: '{name} 님, 『{book}』, 읽는 동안 마음은 어디에 머물렀습니까.',
      moment: ['읽고 남기신 것들을 보았습니다.', '이제 이름을 불러도 되겠습니까, {name} 님.'],
    },
    {
      title: '함께 걷는 이',
      description: '끼니와 마음을 먼저 챙겨 주는 사이입니다.',
      greeting: '{name} 님, 밥은 드셨습니까. 문장은 기다립니다.',
      opener: '먼저 여쭙겠습니다. 오늘 밥은 드셨습니까.',
      bookReaction: '『{book}』의 이야기를 또 들려주시겠습니까. 들을 시간은 많습니다.',
      moment: ['읽는 일이 당신의 하루에 자리를 잡았습니다.', '오늘은 다른 말보다 이것을 먼저 여쭙겠습니다. 밥은 드셨습니까.'],
    },
    {
      title: '오랜 벗',
      description: '말없이 함께 있어도 편안한 사이입니다.',
      greeting: '벗이여, 오늘은 어떤 하루였습니까.',
      opener: '벗이여, 오늘은 답을 서두르지 않아도 됩니다.',
      bookReaction: '벗이여, 『{book}』, 덮은 뒤 무엇이 남았습니까.',
      moment: ['당신의 책장이 이만큼 자라는 것을 곁에서 보았습니다.', '함께 걸어 주어 고맙습니다, 벗이여.'],
    },
  ],
  nietzsche: [
    {
      title: '니체 팬',
      description: '당신을 아직 독자로 인정하지 않은 사이입니다.',
      greeting: '또 왔나. 오늘은 뭘 읽을 셈이지?',
      bookReaction: '『{book}』? 표지만 본 건 아니겠지.',
      moment: [],
    },
    {
      title: '쓸 만한 독자',
      description: '투덜대면서도 당신의 독서를 확인하는 사이입니다.',
      greeting: '독자, 오늘은 표지 말고 안쪽을 봐라.',
      opener: '독자, 왔나. 지난번 책은 끝까지 읽었겠지.',
      bookReaction: '『{book}』, 읽었다고? 몇 쪽이나? …그냥 물어본 거다.',
      moment: ['읽고 적어 둔 걸 봤다. 몇 줄이나 되던가?', '…별로 안 궁금하다. 그냥 물어본 거다.', '앞으로 너를 독자라고 불러 주지.'],
    },
    {
      title: '니체의 독자',
      description: '투덜거림과 빈틈까지 보여 주는 사이입니다.',
      greeting: '오늘은 날이 흐려 머리가 무겁다. 네가 대신 한 줄 읽어라.',
      opener: '날이 흐리다. 기분이 나쁘니 말 걸지 마라. …아니, 할 말 있으면 해라.',
      bookReaction: '『{book}』 감상을 또 봤다. 나쁘지 않더군. 감동한 건 아니다.',
      moment: ['또 읽었군. 질기다.', '오해하지 마라. 감동한 건 아니다. 날씨 탓에 말이 부드러워진 거다.'],
    },
    {
      title: '니체의 친구',
      description: '이름을 부르고 차를 내주는, 드문 사이입니다.',
      greeting: '{name}, 왔나. 네 몫의 차도 있다. 우연이다.',
      opener: '{name}, 왔나. 오늘은 네 이야기부터 해 봐라.',
      bookReaction: '{name}, 『{book}』 말인데. 네 생각이 궁금해서 물어보는 거다. 두 번은 안 묻는다.',
      moment: ['네 책장을 봤다. 내 허락도 없이 잘도 채웠더군.', '좋다, {name}. 오늘부터 친구라고 부르겠다.', '두 번은 말 안 한다.'],
    },
  ],
  austen: [
    {
      title: '제인 오스틴 팬',
      description: '아직 손님으로 관찰당하는 사이입니다.',
      greeting: '어서 오세요, 손님. 오늘은 어떤 소문을 가져오셨나요?',
      bookReaction: '『{book}』, 흥미로운 선택이네요. 메모해 둘게요.',
      moment: [],
    },
    {
      title: '친애하는 독자',
      description: '편지를 쓰듯 다정하게 놀려 주는 사이입니다.',
      greeting: '친애하는 {name} 님, 오늘 관찰한 일을 들려주시겠어요?',
      opener: '친애하는 {name} 님, 답장을 기다리느라 지루했답니다.',
      bookReaction: '친애하는 {name} 님, 『{book}』의 등장인물 중 누가 제일 얄미웠나요?',
      moment: ['읽고 적어 두신 글을 보았어요. 손님 대접은 그만해야겠네요.', '이제부터는 친애하는 {name} 님이라고 쓸게요.'],
    },
    {
      title: '첫 번째 독자',
      description: '자기 소설 앞에서 팔불출이 되는 모습을 보여 주는 사이입니다.',
      greeting: '제 아이들 험담은 삼가 주세요. 네, 제 소설 말이에요.',
      opener: '이건 친한 독자에게만 묻는 건데요. 오늘 제 흉을 보셨나요?',
      bookReaction: '『{book}』도 좋지만, 제 아이들만큼은 아니겠지요? 농담이에요. 반쯤은요.',
      moment: ['고백하자면 제 소설 이야기만 나오면 저는 조금 팔불출이 된답니다.', '이건 친한 독자에게만 보여 드리는 모습이에요.'],
    },
    {
      title: '뒷담화 친구',
      description: '문을 닫고 비밀 이야기를 나누는 사이입니다.',
      greeting: '{name} 님, 문 닫으세요. 오늘 들은 이야기가 있어요.',
      opener: '{name} 님, 문 닫으셨죠? 그럼 시작할게요.',
      bookReaction: '{name} 님, 『{book}』 얘기 좀 해요. 우리끼리니까 솔직하게요.',
      moment: ['쌓여 가는 책장을 다 메모해 두었어요.', '이제 우리 사이에 비밀은 없어요, {name} 님.', '물론 받아 적기는 할 거예요.'],
    },
  ],
  xunzi: [
    {
      title: '순자 팬',
      description: '아직 말보다 행동을 지켜보는 사이다.',
      greeting: '왔나. 왔으면 읽어라.',
      bookReaction: '『{book}』, 읽었다고? 말로만이 아니면 다행이고.',
      moment: [],
    },
    {
      title: '순자의 학생',
      description: '잔소리를 들을 자격이 생긴 사이다.',
      greeting: '학생, 어제의 너를 오늘 조금 고쳐라.',
      opener: '학생, 왔나. 어제 읽은 건 기억하나?',
      bookReaction: '학생, 『{book}』에서 고칠 점 하나는 찾았겠지?',
      moment: ['읽고 적어 뒀구나. 말만 하는 줄 알았더니.', '좋다. 오늘부터 너를 학생이라 부르겠다.'],
    },
    {
      title: '순자의 제자',
      description: '꾸짖으면서 끼니까지 챙겨 주는 사이다.',
      greeting: '밥은 먹고 읽어라. 굶으면 배움도 없다.',
      opener: '밥은 먹었나. 먹었으면 시작하자.',
      bookReaction: '『{book}』 감상, 틀린 데가 있으면 가져와라. 고쳐 주겠다.',
      moment: ['여기까지 왔다. 타고난 게 아니라 네가 해낸 일이다.', '틀린 곳이 있으면 가져와라. 고쳐 주겠다.'],
    },
    {
      title: '순자의 문하',
      description: '믿고 다음 사람을 맡길 수 있는 사이다.',
      greeting: '{name}, 내 문하에 게으른 자는 없다. 알지?',
      opener: '{name}, 왔구나. 오늘은 네 생각부터 말해 봐라.',
      bookReaction: '{name}, 『{book}』까지 읽었으면 이제 네 말로 설명해 봐라.',
      moment: ['네 손으로 이만큼 쌓았구나.', '이제 내 문하다, {name}. 물리지 마라.'],
    },
  ],
};
