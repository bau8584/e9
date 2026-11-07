import { BookOpen, Home, Library, MessageCircle } from 'lucide-react';
import type { Screen } from '../store/progress';
import { goTo, useSnapshot } from '../store/store';

const items = [
  { screen: 'home', label: '홈', Icon: Home },
  { screen: 'dm', label: 'DM', Icon: MessageCircle },
  { screen: 'reading', label: '읽기', Icon: BookOpen },
  { screen: 'myroom', label: '내 방', Icon: Library },
] satisfies { screen: Screen; label: string; Icon: typeof Home }[];

/** 앱 전체 메뉴. 좁은 화면은 하단, 넓은 화면은 왼쪽. 모양은 src/styles/global.css */
export function BottomNav() {
  const { progress } = useSnapshot();
  return (
    <nav className="app-nav" aria-label="주요 메뉴">
      <p className="app-nav-brand">HIP讀</p>
      {items.map(({ screen, label, Icon }) => (
        <button key={screen} type="button" aria-current={progress.screen === screen ? 'page' : undefined} onClick={() => goTo(screen)}>
          <Icon size={20} aria-hidden="true" />
          {label}
          {screen === 'dm' && !progress.dmRead && <span className="dot" aria-label="새 메시지" />}
        </button>
      ))}
    </nav>
  );
}
