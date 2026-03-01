/**
 * QueueService — manages ranked and unranked matchmaking queues.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import { AppError } from '../types/global';
import type { Logger } from '../utils/logger';

interface QueueEntry {
  id: string;
  ownerId: string;
  kind: string;
  createdAt: string;
}

export class QueueService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger
  ) {}

  /** Add a user to the matchmaking queue */
  async joinQueue(userId: string, kind: 'ranked' | 'unranked'): Promise<void> {
    // Check if already in queue
    const { data: existing } = await this.supabase
      .from('match_queue')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existing) {
      throw new AppError('ALREADY_QUEUED', 'You are already in a queue.');
    }

    // Check ranked daily limit (5 per 24h)
    if (kind === 'ranked') {
      await this.checkRankedLimit(userId);
    }

    const { error } = await this.supabase
      .from('match_queue')
      .insert({ owner_id: userId, kind });

    if (error) {
      throw new AppError('DB_ERROR', 'Failed to join queue', error);
    }

    this.logger.info('User joined queue', { userId, kind });
  }

  /** Remove a user from the queue */
  async leaveQueue(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('match_queue')
      .delete()
      .eq('owner_id', userId);

    if (error) {
      throw new AppError('DB_ERROR', 'Failed to leave queue', error);
    }
  }

  /** Find a match opponent in the same queue type */
  async findOpponent(userId: string, kind: string): Promise<QueueEntry | null> {
    const { data } = await this.supabase
      .from('match_queue')
      .select('*')
      .eq('kind', kind)
      .neq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      ownerId: data.owner_id,
      kind: data.kind,
      createdAt: data.created_at || new Date().toISOString(),
    };
  }

  /** Remove both players from queue after matching */
  async removeBothFromQueue(userA: string, userB: string): Promise<void> {
    await this.supabase.from('match_queue').delete().eq('owner_id', userA);
    await this.supabase.from('match_queue').delete().eq('owner_id', userB);
  }

  private async checkRankedLimit(userId: string): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('match_history')
      .select('id')
      .eq('kind', 'ranked')
      .or(`owner_a.eq.${userId},owner_b.eq.${userId}`)
      .gte('created_at', twentyFourHoursAgo);

    if (error) {
      this.logger.warn('Failed to check ranked limit', { error: String(error) });
      return;
    }

    if (data && data.length >= 5) {
      throw new AppError('RANKED_LIMIT', 'You have reached the maximum of 5 ranked matches per 24 hours.');
    }
  }
}
