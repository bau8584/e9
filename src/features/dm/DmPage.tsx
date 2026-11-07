import { useEffect } from 'react';
import { AdaptedLabel } from '../../components/Labels';
import { Portrait } from '../../components/Portrait';
import { getCharacter, getDm } from '../../data';
import { chooseReply, goTo, markDmRead, useSnapshot } from '../../store/store';
import './dm.css';

export function DmPage() {
  const { progress } = useSnapshot();
  useEffect(markDmRead, []);
  if (!progress.favoriteId) return null;
  const character = getCharacter(progress.favoriteId);
  const dm = getDm(character.id, progress.missionIndex);
  const chosen = dm.replies.find((r) => r.id === progress.dmChoiceId);

  return (
    <div className="page dm">
      <header className="dm-head">
        <Portrait character={character} className="dm-avatar" />
        <div className="dm-who">
          <h1 className="dm-name">{character.name}</h1>
          <AdaptedLabel />
        </div>
      </header>
      <div className="dm-thread" aria-live="polite">
        {dm.messages.map((text) => (
          <p key={text} className="bubble bubble-them">
            {text}
          </p>
        ))}
        {chosen && (
          <>
            <p className="bubble bubble-me">{chosen.text}</p>
            {chosen.answer.map((text) => (
              <p key={text} className="bubble bubble-them">
                {text}
              </p>
            ))}
          </>
        )}
      </div>
      {chosen ? (
        <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('reading')}>
          {dm.readButton}
        </button>
      ) : (
        <div className="dm-replies">
          <p className="dm-replies-label">답장 고르기</p>
          {dm.replies.map((reply) => (
            <button key={reply.id} type="button" className="btn btn-reply" onClick={() => chooseReply(reply.id)}>
              {reply.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
