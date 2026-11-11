// 내 방 맨 위: 최애 구역. 초상, 호감 단계와 막대, 함께한 날, 읽은 이야기와 나눈 대화, 인물이 기억하는 한 줄.
// 값은 전부 읽기만 한다(호감은 store/bond, 날과 기억은 store/fan).
import { Portrait } from '../../components/Portrait';
import { getCharacter } from '../../data';
import { bonds } from '../../data/bonds';
import { booksOf } from '../../data/books';
import { episodesOf } from '../../data/episodes';
import { nextBondOf, useBond } from '../../store/bond';
import { useFan } from '../../store/fan';
import { goTo, useSnapshot } from '../../store/store';

export function FavoriteRoom() {
  const { progress } = useSnapshot();
  const bond = useBond();
  const fan = useFan();
  const id = progress.favoriteId;
  if (!id) return null;
  const character = getCharacter(id);
  const stage = bonds[id][bond.stage] ?? bonds[id][0];
  const next = nextBondOf(bond.stage, bond.points);
  const percent = next ? Math.round(next.ratio * 100) : 100;
  const days = Math.max(fan.days, 1);
  const readCount = booksOf(id).flatMap((book) => book.passages).filter((p) => p.id in fan.passages).length;
  const talkCount = episodesOf(id).filter((ep) => ep.id in fan.episodes).length;
  const memories = fan.memories[id] ?? [];
  const call = stage.callName?.replaceAll('{name}', progress.nickname);

  return (
    <section className="mr-fav" aria-label={`${character.name} 구역`}>
      <div className="mr-fav-top">
        <div className="fandom-scope mr-fav-art">
          <Portrait character={character} stage={bond.stage} className="mr-fav-portrait" />
        </div>
        <div className="mr-fav-who">
          <h1 className="mr-fav-name">{character.name}</h1>
          <p className="mr-fav-stage">{stage.title}</p>
          <p className="mr-fav-days">함께한 지 <strong>{days}</strong>일째</p>
          {call && <p className="mr-fav-call">나를 부르는 말 <strong>“{call}”</strong></p>}
        </div>
      </div>

      <div className="mr-bond">
        <div className="mr-bond-line">
          <strong>{next ? '다음 단계까지' : '가장 가까운 사이예요'}</strong>
          {next && <small>{next.remaining}점 남음</small>}
        </div>
        <div className="mr-gauge" role="progressbar" aria-label="다음 호감 단계까지" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ul className="mr-stats" aria-label="함께한 기록">
        <li><strong>{readCount}</strong><span>읽은 이야기</span></li>
        <li><strong>{talkCount}</strong><span>나눈 대화</span></li>
        <li><strong>{days}</strong><span>함께한 날</span></li>
      </ul>

      <div className="mr-memory">
        <h2>{character.name}의 기억 노트</h2>
        {memories.length > 0 ? (
          <ul>
            {memories.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}
          </ul>
        ) : (
          <div className="mr-memory-empty">
            <p>아직 적어 둔 기억이 없어요. 직접 이야기를 들려주면 기억해 둬요.</p>
            <button type="button" className="mr-link" onClick={() => goTo('dm')}>말 걸러 가기</button>
          </div>
        )}
      </div>
    </section>
  );
}
