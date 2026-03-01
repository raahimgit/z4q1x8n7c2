/**
 * MilestoneService — implements rank milestone system.
 * Allocates cumulative OVR increments to active XI players at star thresholds.
 * Handles season cap and pending increments.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import type { PlayerRecord, MilestoneApplication } from '../types/global';
import { MILESTONE_REWARDS, MILESTONE_THRESHOLDS, AppError } from '../types/global';
import type { Logger } from '../utils/logger';

export class MilestoneService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger
  ) {}

  /**
   * Check for new milestones when a team's star total changes.
   * Returns list of newly unlocked MilestoneApplications in chronological order.
   */
  async checkAndApplyMilestones(
    teamId: string,
    stars: number,
    activePlayers: ReadonlyArray<PlayerRecord>
  ): Promise<MilestoneApplication[]> {
    // Get owner_id from team
    const { data: team } = await this.supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .maybeSingle();

    if (!team) {
      throw new AppError('NOT_FOUND', 'Team not found');
    }

    const ownerId = team.owner_id;

    // Get already claimed milestones
    const { data: claimed } = await this.supabase
      .from('milestone_history')
      .select('milestone')
      .eq('owner_id', ownerId);

    const claimedSet = new Set((claimed || []).map((c) => c.milestone as number));

    // Get season cap from current season
    const { data: season } = await this.supabase
      .from('seasons')
      .select('rating_cap')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const seasonCap = season?.rating_cap || 99;

    // Check each threshold
    const applications: MilestoneApplication[] = [];

    for (const threshold of MILESTONE_THRESHOLDS) {
      if (stars < threshold) break;
      if (claimedSet.has(threshold)) continue;

      const rewards = MILESTONE_REWARDS[threshold];
      if (!rewards) continue;

      const application = await this.applyMilestone(
        ownerId, threshold, rewards, activePlayers, seasonCap
      );
      applications.push(application);
    }

    return applications;
  }

  private async applyMilestone(
    ownerId: string,
    milestone: number,
    rewards: Array<{ position: string; amount: number }>,
    activePlayers: ReadonlyArray<PlayerRecord>,
    seasonCap: number
  ): Promise<MilestoneApplication> {
    const appliedTo: MilestoneApplication['appliedTo'] = [];

    for (const reward of rewards) {
      // Find candidates with matching position, sorted by rating desc, then by id
      const candidates = [...activePlayers]
        .filter((p) => p.role === reward.position)
        .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));

      if (candidates.length === 0) {
        this.logger.warn('No active player found for milestone reward', {
          milestone,
          position: reward.position,
          amount: reward.amount,
        });
        continue;
      }

      const player = candidates[0];
      const previousOvr = player.rating;
      const desiredNew = previousOvr + reward.amount;

      if (desiredNew <= seasonCap) {
        // Full application
        const newOvr = Math.round(desiredNew * 10) / 10;
        await this.updatePlayerRating(player.id, newOvr);

        appliedTo.push({
          playerId: player.id,
          position: reward.position,
          delta: reward.amount,
          previousOvr,
          newOvr,
        });
      } else {
        // Partial application
        const applicable = Math.max(0, seasonCap - previousOvr);
        const pending = reward.amount - applicable;

        if (applicable > 0) {
          const newOvr = Math.round((previousOvr + applicable) * 10) / 10;
          await this.updatePlayerRating(player.id, newOvr);
        }

        // Store pending
        if (pending > 0) {
          await this.storePendingIncrement(
            player.id,
            pending,
            `Milestone ${milestone} overflow for ${reward.position}`
          );
        }

        appliedTo.push({
          playerId: player.id,
          position: reward.position,
          delta: applicable,
          previousOvr,
          newOvr: Math.round((previousOvr + applicable) * 10) / 10,
          pending: pending > 0 ? Math.round(pending * 10) / 10 : undefined,
        });

        if (pending > 0) {
          this.logger.warn('Milestone increment partially pending', {
            milestone,
            playerId: player.id,
            position: reward.position,
            applied: applicable,
            pending,
          });
        }
      }
    }

    // Record milestone as claimed
    await this.recordMilestone(ownerId, milestone);

    this.logger.info('Milestone applied', {
      ownerId,
      milestone,
      playersAffected: appliedTo.length,
      appliedTo: appliedTo.map((a) => ({
        position: a.position,
        delta: a.delta,
        pending: a.pending,
      })),
    });

    return {
      milestone,
      applied: true,
      appliedTo,
    };
  }

  private async updatePlayerRating(playerId: string, newRating: number): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .update({ rating: newRating })
      .eq('id', playerId);

    if (error) {
      throw new AppError('DB_ERROR', `Failed to update player ${playerId}`, error);
    }
  }

  private async storePendingIncrement(
    playerId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('milestone_pending_increments')
      .insert({
        player_id: playerId,
        pending_amount: amount,
        reason,
      });

    if (error) {
      throw new AppError('DB_ERROR', 'Failed to store pending increment', error);
    }
  }

  private async recordMilestone(ownerId: string, milestone: number): Promise<void> {
    const { error } = await this.supabase
      .from('milestone_history')
      .insert({
        owner_id: ownerId,
        milestone,
      });

    if (error) {
      this.logger.error('Failed to record milestone', {
        ownerId,
        milestone,
        error: String(error),
      });
    }
  }
}
