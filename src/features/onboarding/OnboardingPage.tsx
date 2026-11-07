import { useState, type FormEvent } from 'react';
import { characters } from '../../data';
import { cleanNickname, EMPTY_NICKNAME_MESSAGE, NICKNAME_MAX } from '../../store/progress';
import { completeOnboarding, pickFavorite, useSnapshot } from '../../store/store';
import { savedLibraryNickname } from '../my-room/storage';
import './onboarding.css';

export function OnboardingPage() {
  const { progress } = useSnapshot();
  const [nickname, setNickname] = useState(() => progress.nickname || cleanNickname(savedLibraryNickname()));
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!cleanNickname(nickname)) {
      setError(EMPTY_NICKNAME_MESSAGE);
      return;
    }
    if (!progress.favoriteId) {
      setError('최애를 한 명 골라 주세요.');
      return;
    }
    completeOnboarding(nickname, progress.favoriteId);
  };

  return (
    <form className="page onboarding" onSubmit={submit} noValidate>
      <h1 className="title">입덕 신고서</h1>
      <label className="field-label" htmlFor="nickname">
        닉네임
      </label>
      <input
        id="nickname"
        className="text-input"
        value={nickname}
        maxLength={NICKNAME_MAX}
        autoComplete="off"
        placeholder="20자까지"
        aria-invalid={error === EMPTY_NICKNAME_MESSAGE}
        aria-describedby="onboarding-error"
        onChange={(e) => {
          setNickname(e.target.value);
          setError('');
        }}
      />
      <fieldset className="favorite-field">
        <legend className="field-label">최애</legend>
        <div className="favorite-grid">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              className="favorite-option"
              aria-pressed={progress.favoriteId === c.id}
              onClick={() => {
                pickFavorite(c.id);
                setError('');
              }}
            >
              <strong>{c.name}</strong>
              <small>{c.englishName}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <p id="onboarding-error" className="form-error" role="alert">
        {error}
      </p>
      <button type="submit" className="btn btn-primary btn-block">
        입덕 완료
      </button>
    </form>
  );
}
