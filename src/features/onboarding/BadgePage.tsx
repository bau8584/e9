import { Portrait } from '../../components/Portrait';
import { getCharacter } from '../../data';
import { goTo, useSnapshot } from '../../store/store';
import './onboarding.css';

export function BadgePage() {
  const { progress } = useSnapshot();
  if (!progress.favoriteId) return null;
  const character = getCharacter(progress.favoriteId);
  return (
    <section className="page badge-page">
      <p className="badge-kicker">입덕 완료</p>
      <div className="fan-badge">
        <Portrait character={character} className="fan-badge-portrait" />
        <p className="fan-badge-name">{character.name} 팬</p>
        <p className="fan-badge-nick">{progress.nickname}</p>
      </div>
      <p className="badge-note">이제 {character.name}에게서 DM이 옵니다. 각오하세요.</p>
      <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('home')}>
        홈으로
      </button>
    </section>
  );
}
