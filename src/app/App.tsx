import { useEffect, useRef, useState } from 'react';
import { DiscoveryDialog } from '../features/discovery/DiscoveryDialog';
import { BottomNav } from '../components/BottomNav';
import { SaveBanner } from '../components/SaveBanner';
import type { CharacterId } from '../data/types';
import { DmPage } from '../features/dm/DmPage';
import { BondMomentHost } from '../features/home/BondMoment';
import { HomePage } from '../features/home/HomePage';
import { LandingPage } from '../features/landing/LandingPage';
import { MyRoomPage } from '../features/my-room/MyRoomPage';
import { BadgePage } from '../features/onboarding/BadgePage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { ReadingPage } from '../features/reading/ReadingPage';
import { checkIn, type DailyGift } from '../store/fan';
import type { Screen } from '../store/progress';
import { getProgress, goTo, reloadFromStorage, STORAGE_KEY, useSnapshot } from '../store/store';

import '../styles/motion.css';

const MAIN_SCREENS: Screen[] = ['home', 'dm', 'reading', 'myroom'];

export function App() {
  const [tasteOpen, setTasteOpen] = useState(false);
  const closeTaste = () => setTasteOpen(false);
  useEffect(() => {
    const open = () => setTasteOpen(true);
    window.addEventListener('hipdok:discovery', open);
    return () => window.removeEventListener('hipdok:discovery', open);
  }, []);
  const { progress, saveFailed } = useSnapshot();
  const { screen, favoriteId } = progress;
  const withNav = MAIN_SCREENS.includes(screen);

  // 날짜 장치: 최애가 정해진 채로 열리면 오늘 첫 방문인지 한 번 확인한다. 받은 선물은 홈에서 인물이 건넨다.
  const [gift, setGift] = useState<{ id: CharacterId; gift: DailyGift } | null>(null);
  const checkedFor = useRef<CharacterId | null>(null);
  useEffect(() => {
    if (!favoriteId || checkedFor.current === favoriteId) return;
    checkedFor.current = favoriteId;
    const received = checkIn(favoriteId);
    if (received) setGift({ id: favoriteId, gift: received });
  }, [favoriteId]);

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
              {screen === 'landing' && <LandingPage />}
              {screen === 'onboarding' && <OnboardingPage />}
              {screen === 'badge' && <BadgePage />}
              {screen === 'home' && (
                <HomePage
                  key={favoriteId ?? ''}
                  gift={gift && gift.id === favoriteId ? gift.gift : null}
                  onGiftSeen={() => setGift(null)}
                />
              )}
              {screen === 'dm' && <DmPage />}
              {screen === 'reading' && <ReadingPage />}
            </div>
          </main>
        </div>
      )}
      {tasteOpen && <div className="fandom-scope"><DiscoveryDialog onClose={closeTaste} /></div>}
      {withNav && <BottomNav />}
      {/* 호감 단계가 오르면 지금 화면 위에 바로 뜬다 */}
      <BondMomentHost enabled={withNav} />
    </>
  );
}
