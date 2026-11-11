import { Portrait } from '../../components/Portrait';
import { AdaptedLabel } from '../../components/Labels';
import { characters, PLAYABLE_IDS, upcomingAuthors } from '../../data';
import { openDiscovery } from '../discovery/DiscoveryDialog';
import { startOnboarding } from '../../store/store';
import './landing.css';

export function LandingPage() {
  return (
    <section className="landing">
      <header className="landing-head">
        <p className="brand">힙독 HIP讀</p>
        <h1 className="landing-title">오늘 당신에게 시비 걸 고전을 고르세요.</h1>
        <p className="landing-sub">최애를 정하고, 매일 만나 가까워지며, 카드 팩을 열어 그의 문장을 모으는 고전 팬덤.</p>
      </header>
      <ul className="landing-grid">
        {characters.filter((c) => PLAYABLE_IDS.includes(c.id)).map((c) => (
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
      <p className="landing-taste" style={{ textAlign: 'center', margin: '12px 0' }}>
        <button type="button" className="btn" onClick={openDiscovery}>
          누굴 고를지 모르겠다면, 12개 질문으로 찾아보기
        </button>
      </p>
      <details className="upcoming" aria-labelledby="upcoming-title">
        <summary id="upcoming-title" className="upcoming-title" style={{ cursor: 'pointer' }}>
          준비 중인 작가들
        </summary>
        {upcomingAuthors.map((group) => (
          <div key={group.region} className="upcoming-group">
            <h3 className="upcoming-region">{group.region}</h3>
            <ul className="upcoming-list">
              {group.authors.map((author) => (
                <li key={author.name} className="upcoming-item">
                  <span className="upcoming-name">{author.name}</span>
                  <span className="upcoming-meta">
                    {author.field}, {author.englishName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>
      <p className="landing-note">
        <AdaptedLabel /> 인물의 말투는 제작진이 지어낸 것이에요. 로그인 없이 시작해요.
      </p>
    </section>
  );
}
