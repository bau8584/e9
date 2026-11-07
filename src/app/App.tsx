import { useEffect, useState } from 'react';
import { DiscoveryDialog } from '../features/discovery/DiscoveryDialog';
import { RESULT_KEY } from '../features/discovery/discoveryData';
import { BottomNav } from '../components/BottomNav';
import { SaveBanner } from '../components/SaveBanner';
import { DmPage } from '../features/dm/DmPage';
import { HomePage } from '../features/home/HomePage';
import { LandingPage } from '../features/landing/LandingPage';
import { MyRoomPage } from '../features/my-room/MyRoomPage';
import { BadgePage } from '../features/onboarding/BadgePage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { ReadingPage } from '../features/reading/ReadingPage';
import type { Screen } from '../store/progress';
import { getProgress, goTo, reloadFromStorage, STORAGE_KEY, useSnapshot } from '../store/store';

import '../styles/motion.css';

const MAIN_SCREENS: Screen[] = ['home', 'dm', 'reading', 'myroom'];
const TASTE_INTRO_KEY = 'hipdok:taste-intro-seen';

// 처음 온 사람에게만 독서 MBTI를 자동으로 연다. 저장소를 못 읽으면 열지 않는다.
function shouldAutoOpenTaste() {
  const { screen, nickname, favoriteId } = getProgress();
  if (screen !== 'landing' || nickname || favoriteId) return false;
  try {
    return !localStorage.getItem(TASTE_INTRO_KEY) && !localStorage.getItem(RESULT_KEY);
  } catch {
    return false;
  }
}

export function App() {
  const [tasteOpen, setTasteOpen] = useState(shouldAutoOpenTaste);
  const closeTaste = () => {
    setTasteOpen(false);
    try {
      localStorage.setItem(TASTE_INTRO_KEY, '1');
    } catch {
      // 저장이 막혀 있어도 창은 닫는다.
    }
  };
  const { progress, saveFailed } = useSnapshot();
  const { screen } = progress;
  const withNav = MAIN_SCREENS.includes(screen);

  // 휴대폰의 뒤로 가기가 앱 안에서 동작하게 한다.
  useEffect(() => {
    if (window.history.state?.screen !== screen) {
      const method = window.history.state?.screen ? 'pushState' : 'replaceState';
      window.history[method]({ screen }, '');
    }
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const target = event.state?.screen as Screen | undefined;
      const current = getProgress();
      const onboarded = Boolean(current.nickname && current.favoriteId);
      if (target && (onboarded ? MAIN_SCREENS.includes(target) : !MAIN_SCREENS.includes(target) && target !== 'badge')) {
        goTo(target);
      } else {
        window.history.pushState({ screen: current.screen }, '');
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) reloadFromStorage();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <>
      {saveFailed && (
        <div className="fandom-scope">
          <SaveBanner />
        </div>
      )}
      {screen === 'myroom' ? (
        <div key={screen} className="hd-screen-quiet">
          <MyRoomPage />
        </div>
      ) : (
        <div className={`fandom-scope${withNav ? ' with-rail' : ''}`}>
          <main className={withNav ? 'with-nav' : undefined}>
            {/* 읽기는 집중하는 화면이라 위치 이동 없이 살짝만 나타난다 */}
            <div key={screen} className={screen === 'reading' ? 'hd-screen-quiet' : 'hd-screen'}>
              {(screen === 'landing' || screen === 'home') && (
                <section className="panel" aria-label="독서 취향 검사" style={{maxWidth: 600, margin: '16px auto', padding: 16}}>
                  <h2 className="section-title">나의 독서 MBTI</h2>
                  <p className="mission-text">12개의 질문으로 나와 취향이 맞는 철학자를 만나 보세요.</p>
                  <button className="btn btn-primary btn-block" type="button" onClick={() => setTasteOpen(true)}>내 유형 찾기</button>
                </section>
              )}
              {screen === 'landing' && <LandingPage />}
              {screen === 'onboarding' && <OnboardingPage />}
              {screen === 'badge' && <BadgePage />}
              {screen === 'home' && <HomePage key={progress.favoriteId ?? ''} />}
              {screen === 'dm' && <DmPage />}
              {screen === 'reading' && <ReadingPage />}
            </div>
          </main>
        </div>
      )}
      {tasteOpen && <div className="fandom-scope"><DiscoveryDialog onClose={closeTaste} /></div>}
      {withNav && <BottomNav />}
    </>
  );
}
