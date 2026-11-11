import { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterSwitcher } from '../../components/CharacterSwitcher';
import { AdaptedLabel } from '../../components/Labels';
import { Portrait } from '../../components/Portrait';
import { getCharacter } from '../../data';
import { bonds } from '../../data/bonds';
import { episodesOf, getEpisode } from '../../data/episodes';
import type { Episode } from '../../data/fanTypes';
import { useBond } from '../../store/bond';
import { getBook, getPassage } from '../../data/books';
import { episodeSlotsLeft, getFan, useFan } from '../../store/fan';
import { markDmRead, useSnapshot } from '../../store/store';
import { AI_CHARACTERS, AiChat, aiChatAvailable } from './AiChat';
import { readEpisodeSession, writeEpisodeSession, type EpisodeSession } from './dmSession';
import { EpisodeList } from './EpisodeList';
import { EpisodeThread } from './EpisodeThread';
import { episodeStatuses, picksFromIds, walkEpisode } from './episodeFlow';
import type { RevealPhase } from './messageReveal';
import './dm.css';

// DM = 최애와의 메신저 대화방. 입덕 직후부터 언제나 열린다.
// 선택 대화 목록과 진행, 그리고 벌어서 쓰는 "대화 시간"(자유대화)이 한 화면에 이어진다.
// 새 선택 대화는 하루에 열 수 있는 편 수가 정해져 있다(episodeSlotsLeft). 끝낸 편은 언제든 다시 본다.
export function DmPage() {
  const { progress } = useSnapshot();
  // 메뉴의 새 메시지 점을 지운다.
  useEffect(markDmRead, [progress.favoriteId]);
  if (!progress.favoriteId) return null;
  return (
    <>
      <div className="dm-switcher">
        <CharacterSwitcher />
      </div>
      <DmRoom key={progress.favoriteId} />
    </>
  );
}

function DmRoom() {
  const { progress } = useSnapshot();
  const character = getCharacter(progress.favoriteId!);
  const nickname = progress.nickname;
  const fan = useFan();
  const stage = useBond().stage;
  const list = episodesOf(character.id);
  const statuses = episodeStatuses(list, fan.episodes, stage, episodeSlotsLeft(character.id, fan));
  const chatOn = aiChatAvailable() && AI_CHARACTERS.includes(character.id);
  /** 지금 열 수 있는 대화인가(끝낸 편, 오늘 열린 편) */
  const canOpen = (target: Episode) => {
    const status = statuses[list.findIndex((e) => e.id === target.id)];
    return status === 'new' || status === 'open' || status === 'done';
  };

  const [session, setSessionState] = useState<EpisodeSession | null>(() => {
    // 읽기에서 대목 화제를 들고 왔으면 대화 시간이 먼저 보이게 목록부터 연다.
    const topic = getFan().talkTopic ? getPassage(getFan().talkTopic!) : undefined;
    if (topic && getBook(topic.bookId)?.characterId === character.id) return null;
    const saved = readEpisodeSession(character.id);
    const target = saved ? getEpisode(saved.id) : undefined;
    // 이어 보던 대화라도 끝내지 않았고 오늘 열 수 없게 되었으면(날짜, 단계) 목록부터.
    return saved && target?.characterId === character.id && (saved.finished || canOpen(target)) ? saved : null;
  });
  const episode = session ? getEpisode(session.id) : undefined;
  const [episodePhase, setEpisodePhase] = useState<RevealPhase>('idle');
  const [chatTyping, setChatTyping] = useState(false);
  const talkRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setSession = useCallback(
    (next: EpisodeSession | null) => {
      setSessionState(next);
      writeEpisodeSession(character.id, next);
    },
    [character.id],
  );

  const toTop = () => talkRef.current?.scrollIntoView?.({ block: 'start' });

  const openEpisode = (target: Episode) => {
    if (!canOpen(target)) return;
    const record = fan.episodes[target.id];
    if (!record) {
      setSession({ id: target.id, picks: {}, seen: 0, finished: null });
    } else {
      // 끝낸 대화는 그때 고른 답 그대로 바로 보여 준다.
      const picks = picksFromIds(target, record);
      const view = walkEpisode(target, picks, nickname);
      setSession({
        id: target.id,
        picks,
        seen: view.items.length,
        finished: view.ended ? { first: false, affinity: 0, ticket: false, ticketFull: false } : null,
      });
    }
    toTop();
  };

  const backToList = () => {
    setSession(null);
    setEpisodePhase('idle');
  };

  const openNextEpisode = () => {
    const next = list[statuses.indexOf('new')];
    if (next) openEpisode(next);
    else listRef.current?.scrollIntoView?.({ block: 'start' });
  };

  const onPhase = useCallback((phase: RevealPhase) => setEpisodePhase(phase), []);
  const onTyping = useCallback((typing: boolean) => setChatTyping(typing), []);
  const presence = episodePhase === 'typing' || chatTyping ? '입력 중' : episodePhase === 'online' ? '접속 중' : null;
  const bond = bonds[character.id][stage];

  return (
    <div className="page dm">
      <header className="dm-stage">
        <Portrait character={character} className="dm-portrait" stage={stage} />
        <div className="dm-who">
          <h1 className="dm-name">{character.name}</h1>
          <p className="dm-relation">{bond.title}</p>
          <AdaptedLabel />
          {presence && (
            <span className="dm-presence" aria-hidden="true">
              {presence}
            </span>
          )}
        </div>
      </header>
      <div className="dm-talk" ref={talkRef}>
        {episode && session && (
          <EpisodeThread
            key={episode.id}
            episode={episode}
            session={session}
            characterId={character.id}
            nickname={nickname}
            onChange={setSession}
            onBack={backToList}
            onPhase={onPhase}
          />
        )}
        <div className="dm-rest" hidden={Boolean(episode)}>
          <div ref={listRef} className="dm-list-wrap">
            <EpisodeList
              episodes={list}
              statuses={statuses}
              nickname={nickname}
              stageTitle={(s) => bonds[character.id][s]?.title ?? ''}
              onOpen={openEpisode}
            />
          </div>
          {chatOn && (
            <AiChat
              characterId={character.id}
              name={character.name}
              nickname={nickname}
              stage={stage}
              onOpenEpisode={openNextEpisode}
              onTyping={onTyping}
            />
          )}
        </div>
      </div>
    </div>
  );
}
