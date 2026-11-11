// 내 방 화면: 최애 구역, 카드 구역, 맨 아래 작은 설정. 바깥 메뉴(홈, DM, 읽기)는 src/components/BottomNav 가 맡는다.
// 예전 서고(방 돌아다니기, 책 등록 등)는 화면에서 내렸다. 저장된 책 기록은 그대로 두고 권 수만 읽는다.
import { useEffect, useState } from 'react';
import { loadLibrary } from '../../library.mjs';
import { FavoriteRoom } from './FavoriteRoom';
import { MyCards } from './MyCards';
import { RoomDialogs, type RoomPopup } from './RoomDialogs';
import { useMyRoomData } from './myRoomData';
import '../../room.css';
import '../../style.css';
import './theme.css';
import './my-cards.css';
import './room-overrides.css';
import './motion.css';
import './my-room-page.css';

/** 예전 독서 기록 권 수. 읽기만 한다. 읽을 수 없으면 0. */
function savedBookCount(): number {
  try {
    const { data, blocked } = loadLibrary(localStorage);
    return blocked ? 0 : data.books.length;
  } catch {
    return 0;
  }
}

export function MyRoomPage() {
  const { nickname } = useMyRoomData();
  const [popup, setPopup] = useState<RoomPopup>(null);
  const [toast, setToast] = useState('');
  const [books] = useState(savedBookCount);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="my-room-scope with-rail">
      <main className="mr-page">
        <FavoriteRoom />
        <MyCards />
        <footer className="mr-foot">
          <p className="mr-foot-name">
            <span>닉네임 {nickname}</span>
            <button type="button" className="mr-link" onClick={() => setPopup('profile')}>바꾸기</button>
          </p>
          <p>기록은 이 기기에만 저장돼요.</p>
          {books > 0 && <p>예전 독서 기록 {books}권은 그대로 보관 중이에요.</p>}
          <button type="button" className="mr-link mr-reset" onClick={() => setPopup('reset')}>카드와 입덕 기록 초기화</button>
        </footer>
      </main>
      <RoomDialogs popup={popup} onClose={() => setPopup(null)} books={books} say={setToast} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
