// 희경 선생님의 내 방 화면. 바깥 메뉴(홈, DM, 읽기)는 src/components/BottomNav 가 맡는다.
import { Bell, ChevronDown, Download, Home } from 'lucide-react';
import { getProgress, goTo } from '../../store/store';
import { LibraryDialogs } from './LibraryDialogs';
import { RoomView } from './RoomView';
import { useLibrary } from './useLibrary';
import '../../room.css';
import '../../style.css';
import './theme.css';

export function MyRoomPage() {
  const lib = useLibrary(getProgress().nickname);
  const { data, error, backup, setNickname, setPopup } = lib;
  return <div className="my-room-scope"><div className="app-shell">
    <main className="main"><header className="topbar"><div className="breadcrumb"><Home size={15}/><span>/</span>내 방 · 개인 서고</div><div className="topbar-actions"><span className="local-indicator"><i/>이 브라우저에 저장 중</span><button className="icon-btn" aria-label="새 메시지 보기" onClick={()=>goTo('dm')}><Bell size={19}/></button><button className="top-user" onClick={()=>{setNickname(data.nickname);setPopup('profile');}}>{data.nickname}<ChevronDown size={14}/></button></div></header>
    <div className="content">{error&&<div className="storage-alert" role="alert">{error}<button onClick={backup}><Download size={14}/>기록 백업</button></div>}
  <RoomView lib={lib}/>
    </div><footer className="footer"><span>HIP讀</span><p>최애에게 DM 보내듯, 문학과 대화하다.</p><small>나만의 서고 · LOCAL EDITION</small></footer></main></div>
  <LibraryDialogs lib={lib}/></div>;
}
