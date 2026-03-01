/**
 * Match model — maps to existing `match_history` and new `match_events` tables.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import type { MatchEvent, MatchSummary } from '../types/global';
import { AppError } from '../types/global';

export interface MatchLog {
  possessionA: number;
  possessionB: number;
  shotsA: number;
  shotsB: number;
  manOfTheMatch: string;
  cards: Array<{ team: string; player: string; type: string }>;
  commentary: string[];
}

export async function saveMatchHistory(
  supabase: SupabaseClient,
  summary: MatchSummary
): Promise<void> {
  const log: MatchLog = {
    possessionA: summary.possessionA,
    possessionB: summary.possessionB,
    shotsA: summary.shotsA,
    shotsB: summary.shotsB,
    manOfTheMatch: summary.manOfTheMatch,
    cards: summary.cards,
    commentary: summary.commentary,
  };

  const { error } = await supabase.from('match_history').insert({
    id: summary.matchId,
    owner_a: summary.teamAId,
    owner_b: summary.teamBId,
    team_a: summary.teamAName,
    team_b: summary.teamBName,
    score_a: summary.scoreA,
    score_b: summary.scoreB,
    kind: summary.isRanked ? 'ranked' : 'unranked',
    log,
  });

  if (error) {
    throw new AppError('DB_ERROR', 'Failed to save match history', error);
  }
}

export async function saveMatchEvents(
  supabase: SupabaseClient,
  matchId: string,
  events: MatchEvent[]
): Promise<void> {
  if (events.length === 0) return;

  const rows = events.map((e) => ({
    match_id: matchId,
    minute: e.minute,
    type: e.type,
    team: e.team,
    player: e.player,
    position: e.position || null,
  }));

  const { error } = await supabase.from('match_events').insert(rows);

  if (error) {
    throw new AppError('DB_ERROR', 'Failed to save match events', error);
  }
}

export async function getMatchById(
  supabase: SupabaseClient,
  matchId: string
): Promise<{ id: string; score_a: number; score_b: number; log: MatchLog } | null> {
  const { data, error } = await supabase
    .from('match_history')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();

  if (error) {
    throw new AppError('DB_ERROR', `Failed to fetch match ${matchId}`, error);
  }

  return data as { id: string; score_a: number; score_b: number; log: MatchLog } | null;
}
