/**
 * Player model — maps to existing `players` table.
 * Handles OVR, positions, active XI determination.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import type { PlayerRecord } from '../types/global';
import { AppError } from '../types/global';

interface PlayerRow {
  id: string;
  team_id: string | null;
  name: string | null;
  role: string | null;
  rating: number | null;
  stamina: number | null;
  traits: string[] | null;
}

export function rowToPlayerRecord(row: PlayerRow): PlayerRecord {
  return {
    id: row.id,
    teamId: row.team_id || '',
    name: row.name || 'Unknown',
    role: row.role || 'CM',
    rating: row.rating || 50,
    stamina: row.stamina || 80,
    traits: row.traits || [],
  };
}

export async function getPlayersByTeamId(
  supabase: SupabaseClient,
  teamId: string
): Promise<PlayerRecord[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId);

  if (error) {
    throw new AppError('DB_ERROR', `Failed to fetch players for team ${teamId}`, error);
  }

  return (data || []).map(rowToPlayerRecord);
}

/**
 * Get active XI for a team.
 * Uses teams.active_lineup (jsonb array of player IDs) to filter.
 * If active_lineup is empty, returns up to 11 players sorted by rating desc.
 */
export async function getActiveXI(
  supabase: SupabaseClient,
  teamId: string,
  activeLineup: string[]
): Promise<PlayerRecord[]> {
  const allPlayers = await getPlayersByTeamId(supabase, teamId);

  if (activeLineup.length > 0) {
    const activeSet = new Set(activeLineup);
    const active = allPlayers.filter((p) => activeSet.has(p.id));
    return active.sort((a, b) => b.rating - a.rating);
  }

  // Fallback: top 11 by rating
  return [...allPlayers]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 11);
}

export async function updatePlayerRating(
  supabase: SupabaseClient,
  playerId: string,
  newRating: number
): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ rating: Math.round(newRating * 10) / 10 })
    .eq('id', playerId);

  if (error) {
    throw new AppError('DB_ERROR', `Failed to update player ${playerId} rating`, error);
  }
}
