import type { CharacterId } from '../../data/types';
import { PackOpener } from '../card/PackOpener';
import { DM_COPY } from './dmCopy';
import type { Reward } from './dmSession';

/** 처음 끝낸 대화에서 받은 것과 팩 열기 */
export function RewardNotice({ reward, characterId }: { reward: Reward; characterId: CharacterId }) {
  return (
    <section className="dm-reward" aria-label={DM_COPY.rewardTitle}>
      <p className="dm-reward-title">{DM_COPY.rewardTitle}</p>
      <ul className="dm-reward-list">
        <li>{DM_COPY.rewardAffinity(reward.affinity)}</li>
        <li>{DM_COPY.rewardPack}</li>
        {reward.ticket && <li>{reward.ticketFull ? DM_COPY.rewardTicketFull : DM_COPY.rewardTicket}</li>}
      </ul>
      <PackOpener characterId={characterId} />
    </section>
  );
}
