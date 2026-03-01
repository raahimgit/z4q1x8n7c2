/**
 * Team model — maps to existing `teams` table.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import type { TeamRecord, TacticsConfig } from '../types/global';
import { AppError } from '../types/global';

interface TeamRow {
  id: string;
  owner_id: string;
  name: string;
  ovr: number | null;
  formation: string | null;
  tactics: unknown;
  active_lineup: unknown;
  attack: number | null;
  defense: number | null;
  stamina: number | null;
  alive: boolean | null;
  tactic: string | null;
  starting_ovr: number | null;
  created_at: string | null;
}

export function rowToTeamRecord(row: TeamRow): TeamRecord {
  let tactics: TacticsConfig = {};
  try {
    tactics = (row.tactics as TacticsConfig) || {};
  } catch {
    tactics = {};
  }

  let activeLineup: string[] = [];
  try {
    activeLineup = Array.isArray(row.active_lineup) ? (row.active_lineup as string[]) : [];
  } catch {
    activeLineup = [];
  }

  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    ovr: row.ovr || 50,
    formation: row.formation || '4-3-3',
    tactics,
    activeLineup,
    attack: row.attack || 0,
    defense: row.defense || 0,
    stamina: row.stamina || 80,
    alive: row.alive !== false,
    tactic: row.tactic || 'balanced',
    startingOvr: row.starting_ovr || 50,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function getTeamByOwnerId(
  supabase: SupabaseClient,
  ownerId: string
): Promise<TeamRecord | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', ownerId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError('DB_ERROR', `Failed to fetch team for owner ${ownerId}`, error);
  }

  return data ? rowToTeamRecord(data as TeamRow) : null;
}

export async function getTeamById(
  supabase: SupabaseClient,
  teamId: string
): Promise<TeamRecord | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();

  if (error) {
    throw new AppError('DB_ERROR', `Failed to fetch team ${teamId}`, error);
  }

  return data ? rowToTeamRecord(data as TeamRow) : null;
}

export async function createTeam(
  supabase: SupabaseClient,
  ownerId: string,
  teamName: string
): Promise<TeamRecord> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      owner_id: ownerId,
      name: teamName,
      ovr: 50,
      formation: '4-3-3',
      tactic: 'balanced',
      tactics: {},
      active_lineup: [],
      attack: 0,
      defense: 0,
      stamina: 80,
      alive: true,
    })
    .select()
    .single();

  if (error) {
    throw new AppError('DB_ERROR', `Failed to create team for ${ownerId}`, error);
  }

  return rowToTeamRecord(data as TeamRow);
}

export async function updateTeamOvr(
  supabase: SupabaseClient,
  teamId: string,
  ovr: number
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ ovr: Math.round(ovr * 10) / 10 })
    .eq('id', teamId);

  if (error) {
    throw new AppError('DB_ERROR', `Failed to update team OVR ${teamId}`, error);
  }
}
