/**
 * LeaderboardService — rankings and stats.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import { AppError } from '../types/global';
import type { Logger } from '../utils/logger';

export interface LeaderboardEntry {
  rank: number;
  ownerId: string;
  teamName: string;
  ovr: number;
  stars: number;
}

export class LeaderboardService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger
  ) {}

  /** Get top N teams by stars (from ratings) joined with team data */
  async getTopByStars(limit: number = 10): Promise<LeaderboardEntry[]> {
    const { data: ratings, error: ratingsErr } = await this.supabase
      .from('ratings')
      .select('owner_id, stars')
      .order('stars', { ascending: false })
      .limit(limit);

    if (ratingsErr) {
      throw new AppError('DB_ERROR', 'Failed to fetch leaderboard', ratingsErr);
    }

    if (!ratings || ratings.length === 0) return [];

    const ownerIds = ratings.map((r) => r.owner_id);
    const { data: teams } = await this.supabase
      .from('teams')
      .select('owner_id, name, ovr')
      .in('owner_id', ownerIds);

    const teamMap = new Map<string, { name: string; ovr: number }>();
    for (const t of teams || []) {
      teamMap.set(t.owner_id, { name: t.name, ovr: t.ovr || 0 });
    }

    return ratings.map((r, i) => {
      const team = teamMap.get(r.owner_id);
      return {
        rank: i + 1,
        ownerId: r.owner_id,
        teamName: team?.name || 'Unknown',
        ovr: team?.ovr || 0,
        stars: r.stars || 0,
      };
    });
  }

  /** Get a user's profile stats */
  async getUserProfile(userId: string): Promise<{
    teamName: string;
    ovr: number;
    stars: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
  } | null> {
    const { data: team } = await this.supabase
      .from('teams')
      .select('name, ovr')
      .eq('owner_id', userId)
      .maybeSingle();

    if (!team) return null;

    const { data: rating } = await this.supabase
      .from('ratings')
      .select('stars')
      .eq('owner_id', userId)
      .maybeSingle();

    // Count matches
    const { data: matches } = await this.supabase
      .from('match_history')
      .select('score_a, score_b, owner_a, owner_b')
      .or(`owner_a.eq.${userId},owner_b.eq.${userId}`);

    let wins = 0, draws = 0, losses = 0;
    for (const m of matches || []) {
      const isA = m.owner_a === userId;
      const myScore = isA ? m.score_a : m.score_b;
      const oppScore = isA ? m.score_b : m.score_a;
      if (myScore > oppScore) wins++;
      else if (myScore < oppScore) losses++;
      else draws++;
    }

    return {
      teamName: team.name,
      ovr: team.ovr || 0,
      stars: rating?.stars || 10,
      matchesPlayed: (matches || []).length,
      wins,
      draws,
      losses,
    };
  }
}
