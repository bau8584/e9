// 내 방 화면. 바깥 메뉴(홈, DM, 읽기)는 src/components/BottomNav 가 맡는다.
import { Bell, ChevronDown, Download, Home } from 'lucide-react';
import { getProgress, goTo } from '../../store/store';
import { useLibrarySyncPaused } from '../../sync/sync';
import { CardSummary } from './MyCards';
import { LibraryDialogs } from './LibraryDialogs';
import { namesDiffer, useMyRoomData } from './myRoomData';
import { RoomView } from './RoomView';
import { useLibrary } from './useLibrary';
import '../../room.css';
import '../../style.css';
import './theme.css';
import './my-cards.css';
import './room-overrides.css';
import './motion.css';

export function MyRoomPage() {
  const lib = useLibrary(getProgress().nickname);
  const { data, error, backup, setNickname, setPopup, blocked, unifyName } = lib;
  const home = useMyRoomData().nickname;
  const syncPaused = useLibrarySyncPaused();
  return <div className="my-room-scope"><div className="app-shell">
    <main className="main"><header className="topbar"><div className="breadcrumb"><Home size={15}/><span>/</span>내 방 · 개인 서고</div><div className="topbar-actions"><span className="local-indicator"><i/>내 기록 저장 중</span><button className="icon-btn" aria-label="새 메시지 보기" onClick={()=>goTo('dm')}><Bell size={19}/></button><button className="top-user" onClick={()=>{setNickname(data.nickname);setPopup('profile');}}>{data.nickname}<ChevronDown size={14}/></button></div></header>
    <div className="content">{error&&<div className="storage-alert" role="alert">{error}<button onClick={backup}><Download size={14}/>기록 백업</button></div>}
  {!blocked&&namesDiffer(home,data.nickname)&&<div className="name-notice" role="status"><p>이름이 두 개예요. 홈에서는 <strong>{home}</strong>, 서고에서는 <strong>{data.nickname}</strong>(으)로 불러요. 저절로 바꾸지 않으니 하나를 골라 주세요.</p><div><button className="secondary" onClick={()=>unifyName(home)}>{home}(으)로 통일</button><button className="secondary" onClick={()=>unifyName(data.nickname)}>{data.nickname}(으)로 통일</button></div></div>}
  {syncPaused&&<div className="name-notice" role="status" data-testid="library-sync-paused"><p>서고가 커서 서버 저장은 쉬어요. 이 기기의 기록은 그대로 있어요.</p></div>}
  <CardSummary/>
  <RoomView lib={lib}/>
    </div><footer className="footer"><span>HIP讀</span><p>최애에게 DM 보내듯, 문학과 대화하다.</p><small>나만의 서고</small></footer></main>
</div>
  <LibraryDialogs lib={lib}/></div>;
}
