/**
 * Global type definitions for El Royale FC Discord Bot.
 * Adapted to match existing Supabase database schema.
 */

export type TeamSide = 'A' | 'B';

export type MatchEventType =
  | 'pass'
  | 'dribble'
  | 'shot'
  | 'goal'
  | 'foul'
  | 'yellow_card'
  | 'red_card';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  team: TeamSide;
  player: string;
  position?: string;
}

/** Mapped to existing `teams` table */
export interface TeamRecord {
  id: string;
  ownerId: string;       // teams.owner_id (discord id)
  name: string;           // teams.name
  ovr: number;            // teams.ovr
  formation: string;      // teams.formation
  tactics: TacticsConfig; // teams.tactics (jsonb)
  activeLineup: string[]; // teams.active_lineup (jsonb array of player IDs)
  attack: number;         // teams.attack
  defense: number;        // teams.defense
  stamina: number;        // teams.stamina
  alive: boolean;         // teams.alive
  tactic: string;         // teams.tactic
  startingOvr: number;    // teams.starting_ovr
  createdAt: string;
}

export interface TacticsConfig {
  defense?: {
    width?: number;
    pressure?: number;
    aggression?: number;
  };
  buildup?: {
    positioning?: number;
    passingDistance?: number;
  };
  offense?: {
    shootingTendency?: number;
    crossingTendency?: number;
    passingTendency?: number;
  };
}

/** Mapped to existing `players` table */
export interface PlayerRecord {
  id: string;
  teamId: string;    // players.team_id
  name: string;      // players.name
  role: string;      // players.role — position (ST/CF/LW/RW/CB/LCB/RCB/CM/CAM/CDM/GK)
  rating: number;    // players.rating — current OVR
  stamina: number;   // players.stamina
  traits: string[];  // players.traits
}

/** Mapped to existing `ratings` table */
export interface RatingRecord {
  id: string;
  ownerId: string;
  stars: number;
  seasonId: string | null;
  lastReset: string;
  createdAt: string;
}

export interface MatchSummary {
  matchId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  possessionA: number;
  possessionB: number;
  shotsA: number;
  shotsB: number;
  winnerId: string | null;
  events: MatchEvent[];
  commentary: string[];
  manOfTheMatch: string;
  isRanked: boolean;
  cards: { team: TeamSide; player: string; type: 'yellow_card' | 'red_card' }[];
}

export interface MatchSetup {
  matchId: string;
  teamA: TeamRecord;
  teamB: TeamRecord;
  playersA: PlayerRecord[];
  playersB: PlayerRecord[];
  isRanked: boolean;
}

export interface CommentaryContext {
  minute: number;
  scoreA: number;
  scoreB: number;
  homeTeamName: string;
  awayTeamName: string;
}

export interface MilestoneApplication {
  milestone: number;
  applied: boolean;
  appliedTo: Array<{
    playerId: string;
    position: string;
    delta: number;
    previousOvr: number;
    newOvr: number;
    pending?: number;
  }>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export interface EloResult {
  newRatingA: number;
  newRatingB: number;
  deltaA: number;
  deltaB: number;
}

export const MILESTONE_REWARDS: Record<number, Array<{ position: string; amount: number }>> = {
  20: [{ position: 'ST', amount: 0.5 }, { position: 'CB', amount: 0.5 }],
  30: [{ position: 'LW', amount: 0.5 }, { position: 'CM', amount: 0.5 }],
  40: [{ position: 'RW', amount: 0.5 }, { position: 'CDM', amount: 0.5 }],
  50: [{ position: 'ST', amount: 1.0 }],
  60: [{ position: 'CB', amount: 1.0 }],
  70: [{ position: 'GK', amount: 1.0 }],
  80: [{ position: 'CF', amount: 1.0 }, { position: 'CAM', amount: 0.5 }],
  90: [{ position: 'LW', amount: 1.0 }, { position: 'RW', amount: 1.0 }],
  100: [
    { position: 'ST', amount: 0.5 },
    { position: 'CF', amount: 1.0 },
    { position: 'CB', amount: 0.5 },
    { position: 'GK', amount: 1.0 },
    { position: 'LCB', amount: 1.0 },
    { position: 'RCB', amount: 1.0 },
    { position: 'LW', amount: 0.5 },
    { position: 'RW', amount: 0.5 },
    { position: 'CM', amount: 0.5 },
    { position: 'CDM', amount: 0.5 },
  ],
};

export const MILESTONE_THRESHOLDS = [20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export const STAR_DELTAS = {
  win: 1.0,
  draw: 0.3,
  loss: -0.7,
} as const;

export const ELO_K_FACTOR = 32;
