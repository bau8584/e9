import type { Episode } from '../../data/fanTypes';
import { DM_COPY } from './dmCopy';
import type { EpisodeStatus } from './episodeFlow';

interface Props {
  episodes: Episode[];
  statuses: EpisodeStatus[];
  onOpen: (episode: Episode) => void;
}

/** 선택 대화 목록. 새 메시지 하나를 맨 위에 크게, 나머지는 메신저 대화 목록처럼. */
export function EpisodeList({ episodes, statuses, onOpen }: Props) {
  const newIndex = statuses.indexOf('new');
  const fresh = newIndex >= 0 ? episodes[newIndex] : undefined;

  return (
    <section className="dm-list" aria-label={DM_COPY.listTitle}>
      {fresh && (
        <button type="button" className="dm-new" onClick={() => onOpen(fresh)}>
          <span className="dm-new-tag">{DM_COPY.newTag}</span>
          <span className="dm-new-title">{fresh.title}</span>
          <span className="dm-new-preview">{fresh.preview}</span>
          <span className="dm-new-cta">{DM_COPY.newCta}</span>
        </button>
      )}
      <h2 className="section-title dm-list-title">{DM_COPY.listTitle}</h2>
      {episodes.length === 0 ? (
        <p className="dm-list-note">{DM_COPY.emptyList}</p>
      ) : (
        <>
          {!fresh && !statuses.includes('open') && <p className="dm-list-note">{DM_COPY.allDone}</p>}
          <ul className="dm-eps">
            {episodes.map((episode, index) => {
              const status = statuses[index];
              if (status === 'new') return null;
              const locked = status === 'locked';
              return (
                <li key={episode.id}>
                  <button
                    type="button"
                    className={`dm-ep is-${status}`}
                    disabled={locked}
                    onClick={() => onOpen(episode)}
                  >
                    <span className="dm-ep-main">
                      <span className="dm-ep-title">{locked ? DM_COPY.lockedTag : episode.title}</span>
                      {!locked && <span className="dm-ep-preview">{episode.preview}</span>}
                    </span>
                    {status === 'done' && <span className="dm-ep-status">{DM_COPY.doneTag}</span>}
                    {status === 'open' && <span className="dm-ep-dot" aria-label="안 읽음" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
