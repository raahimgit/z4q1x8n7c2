/**
 * Simulation utility functions — deterministic helpers for MatchEngine.
 */
import type { PlayerRecord, TeamRecord, TeamSide, EloResult } from '../types/global';
import { ELO_K_FACTOR } from '../types/global';
import { FORMATION_WEIGHTS, ATTACK_POSITIONS, DEFENSE_POSITIONS } from './MatchTypes';
import { hashStringToSeed } from '../utils/seedableRng';

/**
 * Calculate effective team strength based on OVR, formation, and tactics.
 * Returns a value typically between 40 and 100.
 */
export function calculateTeamStrength(team: TeamRecord, players: PlayerRecord[]): number {
  if (players.length === 0) return team.ovr;

  const avgRating = players.reduce((sum, p) => sum + p.rating, 0) / players.length;
  const formationMod = FORMATION_WEIGHTS[team.formation] || { attackMod: 1.0, defenseMod: 1.0 };
  const overallMod = (formationMod.attackMod + formationMod.defenseMod) / 2;

  return avgRating * overallMod;
}

/**
 * Compute possession probability for team A given strengths.
 * Returns probability [0.3, 0.7] clamped.
 */
export function possessionProbability(strengthA: number, strengthB: number): number {
  const total = strengthA + strengthB;
  if (total === 0) return 0.5;
  const raw = strengthA / total;
  return Math.max(0.3, Math.min(0.7, raw));
}

/**
 * Pick a player deterministically for a given event context.
 * Uses position-based selection: attackers for shots/goals, defenders for fouls, etc.
 */
export function pickPlayer(
  rng: () => number,
  players: ReadonlyArray<PlayerRecord>,
  eventType: string
): PlayerRecord {
  if (players.length === 0) {
    throw new Error('Cannot pick from empty player list');
  }

  const isAttack = ['shot', 'goal', 'dribble'].includes(eventType);
  const isDefense = ['foul', 'yellow_card', 'red_card'].includes(eventType);

  const targetPositions = isAttack
    ? ATTACK_POSITIONS
    : isDefense
    ? DEFENSE_POSITIONS
    : [];

  const candidates = targetPositions.length > 0
    ? players.filter((p) => (targetPositions as ReadonlyArray<string>).includes(p.role))
    : [];

  const pool = candidates.length > 0 ? candidates : players;
  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

/**
 * Calculate ELO rating changes for two teams after a match.
 * K-factor = 32. Ratings clamped to >= 0.
 */
export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  scoreB: number
): EloResult {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  let actualA: number;
  let actualB: number;

  if (scoreA > scoreB) {
    actualA = 1;
    actualB = 0;
  } else if (scoreA < scoreB) {
    actualA = 0;
    actualB = 1;
  } else {
    actualA = 0.5;
    actualB = 0.5;
  }

  const deltaA = Math.round(ELO_K_FACTOR * (actualA - expectedA));
  const deltaB = Math.round(ELO_K_FACTOR * (actualB - expectedB));

  return {
    newRatingA: Math.max(0, ratingA + deltaA),
    newRatingB: Math.max(0, ratingB + deltaB),
    deltaA,
    deltaB,
  };
}

/**
 * Deterministic hash for template variant selection.
 */
export function deterministicVariant(minute: number, player: string, teamName: string, numVariants: number): number {
  const combined = `${minute}:${player}:${teamName}`;
  const hash = hashStringToSeed(combined);
  return hash % numVariants;
}

/**
 * Determine man-of-the-match from player stats.
 * Priority: goals > assists > shots > passes
 */
export function determineManOfMatch(
  stats: Map<string, { goals: number; assists: number; shots: number; passes: number }>
): string {
  let best = '';
  let bestScore = -1;

  for (const [player, s] of stats) {
    const score = s.goals * 1000 + s.assists * 100 + s.shots * 10 + s.passes;
    if (score > bestScore) {
      bestScore = score;
      best = player;
    }
  }

  return best || 'Unknown';
}
