/**
 * MatchService — orchestrates match simulation, persistence, and ELO updates.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import type { MatchSetup, MatchSummary, TeamRecord, PlayerRecord } from '../types/global';
import { AppError, STAR_DELTAS } from '../types/global';
import { MatchEngine } from '../match/MatchEngine';
import { calculateElo } from '../match/SimulationUtils';
import * as MatchModel from '../models/MatchModel';
import type { Logger } from '../utils/logger';

export class MatchService {
  private readonly engine: MatchEngine;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger
  ) {
    this.engine = new MatchEngine(logger);
  }

  /** Run a full match simulation and persist results */
  async runMatch(setup: MatchSetup): Promise<MatchSummary> {
    const result = await this.engine.simulate({
      matchId: setup.matchId,
      teamA: setup.teamA,
      teamB: setup.teamB,
      playersA: setup.playersA,
      playersB: setup.playersB,
      isRanked: setup.isRanked,
    });

    const summary: MatchSummary = {
      matchId: result.matchId,
      teamAId: setup.teamA.ownerId,
      teamBId: setup.teamB.ownerId,
      teamAName: setup.teamA.name,
      teamBName: setup.teamB.name,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      possessionA: result.possessionA,
      possessionB: result.possessionB,
      shotsA: result.shotsA,
      shotsB: result.shotsB,
      winnerId: result.winnerId,
      events: result.events,
      commentary: [],
      manOfTheMatch: result.manOfTheMatch,
      isRanked: setup.isRanked,
      cards: result.cards,
    };

    // Persist with retry
    await this.persistWithRetry(summary, result.events, 3);

    // Update ELO for ranked matches
    if (setup.isRanked) {
      await this.updateRatings(setup.teamA, setup.teamB, result.scoreA, result.scoreB);
    }

    return summary;
  }

  private async persistWithRetry(
    summary: MatchSummary,
    events: MatchSummary['events'],
    maxRetries: number
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await MatchModel.saveMatchHistory(this.supabase, summary);
        await MatchModel.saveMatchEvents(this.supabase, summary.matchId, events);
        return;
      } catch (err) {
        this.logger.error(`Failed to persist match (attempt ${attempt}/${maxRetries})`, {
          matchId: summary.matchId,
          error: String(err),
        });
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    this.logger.error('All retries exhausted for match persistence', { matchId: summary.matchId });
  }

  private async updateRatings(
    teamA: TeamRecord,
    teamB: TeamRecord,
    scoreA: number,
    scoreB: number
  ): Promise<void> {
    try {
      const elo = calculateElo(teamA.ovr, teamB.ovr, scoreA, scoreB);

      // Update team OVR (used as rating proxy)
      await this.supabase
        .from('teams')
        .update({ ovr: elo.newRatingA })
        .eq('id', teamA.id);

      await this.supabase
        .from('teams')
        .update({ ovr: elo.newRatingB })
        .eq('id', teamB.id);

      // Update stars
      const starDeltaA = scoreA > scoreB ? STAR_DELTAS.win
        : scoreA < scoreB ? STAR_DELTAS.loss
        : STAR_DELTAS.draw;

      const starDeltaB = scoreB > scoreA ? STAR_DELTAS.win
        : scoreB < scoreA ? STAR_DELTAS.loss
        : STAR_DELTAS.draw;

      // Upsert stars in ratings table
      await this.updateStars(teamA.ownerId, starDeltaA);
      await this.updateStars(teamB.ownerId, starDeltaB);

      this.logger.info('Ratings updated', {
        teamA: teamA.name,
        eloA: elo.newRatingA,
        deltaA: elo.deltaA,
        teamB: teamB.name,
        eloB: elo.newRatingB,
        deltaB: elo.deltaB,
      });
    } catch (err) {
      this.logger.error('Failed to update ratings', { error: String(err) });
    }
  }

  private async updateStars(ownerId: string, delta: number): Promise<void> {
    // Get current rating row
    const { data } = await this.supabase
      .from('ratings')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (data) {
      const newStars = Math.max(0, (data.stars || 10) + delta);
      await this.supabase
        .from('ratings')
        .update({ stars: newStars })
        .eq('id', data.id);
    } else {
      await this.supabase
        .from('ratings')
        .insert({ owner_id: ownerId, stars: Math.max(0, 10 + delta) });
    }
  }
}
