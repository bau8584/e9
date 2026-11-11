import type { Episode } from '../../data/fanTypes';
import { DM_COPY } from './dmCopy';
import { fillName, type EpisodeStatus } from './episodeFlow';

interface Props {
  episodes: Episode[];
  statuses: EpisodeStatus[];
  nickname: string;
  /** 호감 단계 번호 → 그 단계 이름(잠긴 대화 안내) */
  stageTitle: (stage: number) => string;
  onOpen: (episode: Episode) => void;
}

/**
 * 선택 대화 목록. 새 메시지 하나를 맨 위에 크게, 나머지는 메신저 대화 목록처럼.
 * 오늘 열 수 있는 대화를 다 나눴으면 다음 편을 "내일 도착"으로 첫 줄만 미리 보여 준다.
 * 호감 단계가 모자라 잠긴 대화는 따로, 어느 단계에서 열리는지 알려 준다.
 */
export function EpisodeList({ episodes, statuses, nickname, stageTitle, onOpen }: Props) {
  const newIndex = statuses.indexOf('new');
  const fresh = newIndex >= 0 ? episodes[newIndex] : undefined;
  const waitIndex = fresh ? -1 : statuses.indexOf('waiting');
  const waiting = waitIndex >= 0 ? episodes[waitIndex] : undefined;
  const firstLine = waiting ? fillName(waiting.beats[0]?.say[0] ?? waiting.preview, nickname) : '';

  return (
    <section className="dm-list" aria-label={DM_COPY.listTitle}>
      {fresh && (
        <button type="button" className="dm-new" onClick={() => onOpen(fresh)}>
          <span className="dm-new-tag">{DM_COPY.newTag}</span>
          <span className="dm-new-title">{fresh.title}</span>
          <span className="dm-new-preview">{fillName(fresh.preview, nickname)}</span>
          <span className="dm-new-cta">{DM_COPY.newCta}</span>
        </button>
      )}
      {waiting && (
        <div className="dm-wait" role="status">
          <span className="dm-wait-tag">{DM_COPY.waitingTag}</span>
          <span className="dm-wait-title">{waiting.title}</span>
          <p className="bubble bubble-them dm-wait-line">{firstLine}</p>
          <span className="dm-wait-hint">{DM_COPY.waitingHint}</span>
        </div>
      )}
      <h2 className="section-title dm-list-title">{DM_COPY.listTitle}</h2>
      {episodes.length === 0 ? (
        <p className="dm-list-note">{DM_COPY.emptyList}</p>
      ) : (
        <>
          {!fresh && !waiting && !statuses.includes('open') && <p className="dm-list-note">{DM_COPY.allDone}</p>}
          <ul className="dm-eps">
            {episodes.map((episode, index) => {
              const status = statuses[index];
              if (status === 'new' || index === waitIndex) return null;
              const closed = status === 'locked' || status === 'waiting';
              const label =
                status === 'locked' ? DM_COPY.lockedStage(stageTitle(episode.minStage)) : status === 'waiting' ? DM_COPY.waitingLater : episode.title;
              return (
                <li key={episode.id}>
                  <button
                    type="button"
                    className={`dm-ep is-${status}`}
                    disabled={closed}
                    onClick={() => onOpen(episode)}
                  >
                    <span className="dm-ep-main">
                      <span className="dm-ep-title">{label}</span>
                      {!closed && <span className="dm-ep-preview">{fillName(episode.preview, nickname)}</span>}
                    </span>
                    {status === 'done' && <span className="dm-ep-status">{DM_COPY.doneTag}</span>}
                    {status === 'open' && <span className="dm-ep-dot" role="img" aria-label="안 읽음" />}
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
