// 내 방의 두 창: 이름 바꾸기, 카드와 입덕 기록 초기화(확인). 책 기록은 읽기만 하고 고치지 않는다.
import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Dialog } from './Dialog';
import { cleanNickname, NICKNAME_MAX, renameNickname, useMyRoomData } from './myRoomData';

export type RoomPopup = 'profile' | 'reset' | null;

type Props = { popup: Exclude<RoomPopup, null>; onClose: () => void; books: number; say: (text: string) => void };

/** 열릴 때마다 새로 그려서 이름 칸이 지금 이름으로 시작한다. */
export function RoomDialogs(props: Omit<Props, 'popup'> & { popup: RoomPopup }) {
  return props.popup ? <OpenDialog {...props} popup={props.popup} /> : null;
}

function OpenDialog({ popup, onClose, books, say }: Props) {
  const room = useMyRoomData();
  const [name, setName] = useState(room.nickname);

  function save(event: FormEvent) {
    event.preventDefault();
    const clean = cleanNickname(name);
    if (!clean) return;
    renameNickname(clean);
    onClose();
    say('이름을 바꿨어요.');
  }
  function reset() {
    if (!room.resetAll()) say('지우지 못했어요. 브라우저 저장 설정을 확인해 주세요. 기록은 그대로예요.');
    onClose();
  }

  return (
    <Dialog title={popup === 'profile' ? '이름 바꾸기' : '카드와 입덕 기록을 지울까요?'} onClose={onClose}>
      {popup === 'profile' && (
        <form className="profile-form" onSubmit={save}>
          <p>홈과 내 방에서 쓰는 이름이에요.</p>
          <label htmlFor="nickname">닉네임</label>
          <input id="nickname" autoFocus required maxLength={NICKNAME_MAX} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary full" type="submit">저장하기<Check size={16} /></button>
        </form>
      )}
      {popup === 'reset' && (
        <div className="reset-confirm">
          <h3>지워지는 것</h3>
          <ul>
            <li>문장 카드 {room.cards.length}장</li>
            <li>팬덤 점수 {room.score}점</li>
            <li>모은 인물 카드, 카드 팩, 조각</li>
            <li>호감도, 읽은 이야기와 대화 기록</li>
            <li>입덕 기록(닉네임, 최애)</li>
          </ul>
          {books > 0 && (
            <>
              <h3>그대로 남는 것</h3>
              <ul><li>예전 독서 기록 {books}권</li></ul>
            </>
          )}
          <p>지운 카드와 점수는 되돌릴 수 없고, 첫 화면부터 다시 시작합니다.</p>
          <div className="reset-actions">
            <button className="secondary" data-first onClick={onClose}>취소</button>
            <button className="danger" onClick={reset}>카드와 입덕 기록 지우기</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
