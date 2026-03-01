/**
 * Match simulation types and constants.
 */
import type { TeamRecord, PlayerRecord, MatchEvent, TeamSide } from '../types/global';

export interface MatchState {
  minute: number;
  scoreA: number;
  scoreB: number;
  possessionA: number;
  possessionB: number;
  shotsA: number;
  shotsB: number;
  events: MatchEvent[];
  yellowCardsA: Map<string, number>;
  yellowCardsB: Map<string, number>;
  redCardsA: Set<string>;
  redCardsB: Set<string>;
  playerStats: Map<string, PlayerMatchStats>;
}

export interface PlayerMatchStats {
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

export interface MatchInput {
  matchId: string;
  teamA: TeamRecord;
  teamB: TeamRecord;
  playersA: PlayerRecord[];
  playersB: PlayerRecord[];
  isRanked: boolean;
}

export interface MatchResult {
  matchId: string;
  scoreA: number;
  scoreB: number;
  possessionA: number;
  possessionB: number;
  shotsA: number;
  shotsB: number;
  events: MatchEvent[];
  winnerId: string | null;
  manOfTheMatch: string;
  cards: Array<{ team: TeamSide; player: string; type: 'yellow_card' | 'red_card' }>;
}

/** Base probabilities per minute (adjusted by OVR difference) */
export const BASE_PROBABILITIES = {
  pass: 0.45,
  dribble: 0.15,
  shot: 0.08,
  goal_from_shot: 0.30,
  foul: 0.06,
  yellow_from_foul: 0.25,
  red_from_foul: 0.03,
} as const;

/** Formation weight modifiers for attack/defense balance */
export const FORMATION_WEIGHTS: Record<string, { attackMod: number; defenseMod: number }> = {
  '4-3-3': { attackMod: 1.05, defenseMod: 1.0 },
  '4-4-2': { attackMod: 1.0, defenseMod: 1.05 },
  '3-5-2': { attackMod: 1.1, defenseMod: 0.9 },
  '5-3-2': { attackMod: 0.9, defenseMod: 1.15 },
  '4-2-3-1': { attackMod: 1.05, defenseMod: 1.05 },
  '3-4-3': { attackMod: 1.15, defenseMod: 0.85 },
  '4-1-4-1': { attackMod: 1.0, defenseMod: 1.1 },
  '4-5-1': { attackMod: 0.95, defenseMod: 1.1 },
};

export const ATTACK_POSITIONS = ['ST', 'CF', 'LW', 'RW', 'CAM'] as const;
export const MIDFIELD_POSITIONS = ['CM', 'CDM', 'CAM'] as const;
export const DEFENSE_POSITIONS = ['CB', 'LCB', 'RCB', 'LB', 'RB'] as const;
