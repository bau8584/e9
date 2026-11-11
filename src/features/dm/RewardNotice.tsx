import type { CharacterId } from '../../data/types';
import { PackOpener } from '../card/PackOpener';
import { DM_COPY } from './dmCopy';
import type { Reward } from './dmSession';

interface Props {
  reward: Reward;
  characterId: CharacterId;
  /** 방금 받았다. 팩을 받았으면 그 자리에서 바로 연다(다시 들어와 볼 때는 열지 않는다). */
  fresh?: boolean;
}

/** 처음 끝낸 대화에서 받은 것과 팩 열기 */
export function RewardNotice({ reward, characterId, fresh = false }: Props) {
  const pack = reward.pack !== false;
  return (
    <section className="dm-reward" aria-label={DM_COPY.rewardTitle}>
      <p className="dm-reward-title">{DM_COPY.rewardTitle}</p>
      <ul className="dm-reward-list">
        <li>{DM_COPY.rewardAffinity(reward.affinity)}</li>
        <li className={pack ? undefined : 'is-none'}>{pack ? DM_COPY.rewardPack : DM_COPY.rewardNoPack}</li>
        {reward.ticket && <li>{reward.ticketFull ? DM_COPY.rewardTicketFull : DM_COPY.rewardTicket}</li>}
      </ul>
      <PackOpener characterId={characterId} autoOpen={fresh && pack} />
    </section>
  );
}
