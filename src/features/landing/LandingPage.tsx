import { Portrait } from '../../components/Portrait';
import { AdaptedLabel } from '../../components/Labels';
import { characters } from '../../data';
import { startOnboarding } from '../../store/store';
import './landing.css';

export function LandingPage() {
  return (
    <section className="landing">
      <header className="landing-head">
        <p className="brand">힙독 HIP讀</p>
        <h1 className="landing-title">오늘 당신에게 시비 걸 고전을 고르세요.</h1>
        <p className="landing-sub">최애를 정하고, DM을 받고, 원문을 읽어 문장 카드를 모으는 고전 팬덤.</p>
      </header>
      <ul className="landing-grid">
        {characters.map((c) => (
          <li key={c.id}>
            <button type="button" className="landing-card" onClick={() => startOnboarding(c.id)}>
              <Portrait character={c} />
              <span className="landing-card-text">
                <span className="landing-name">{c.name}</span>
                <span className="landing-english">{c.englishName}</span>
                <span className="landing-line">{c.tagline}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="landing-note">
        <AdaptedLabel /> 인물의 말투는 제작진이 지어낸 것이에요. 로그인 없이 시작해요.
      </p>
    </section>
  );
}
