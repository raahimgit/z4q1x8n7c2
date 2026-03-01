/**
 * Deterministic match simulation engine.
 * Uses seeded RNG (mulberry32) from match_id for reproducible results.
 * Non-blocking: yields to event loop periodically.
 */
import type { PlayerRecord, TeamRecord, MatchEvent, TeamSide } from '../types/global';
import type { MatchInput, MatchResult, MatchState, PlayerMatchStats } from './MatchTypes';
import { BASE_PROBABILITIES } from './MatchTypes';
import { createMatchRng, rngChance, rngPick } from '../utils/seedableRng';
import { calculateTeamStrength, possessionProbability, pickPlayer, determineManOfMatch } from './SimulationUtils';
import { createCommentaryEngine, CommentaryEngine } from './CommentaryEngine';
import type { Logger } from '../utils/logger';

export class MatchEngine {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async simulate(input: MatchInput): Promise<MatchResult> {
    const { matchId, teamA, teamB, playersA, playersB } = input;
    const rng = createMatchRng(matchId);

    this.logger.info('Starting match simulation', { matchId, teamA: teamA.name, teamB: teamB.name });

    const strengthA = calculateTeamStrength(teamA, playersA);
    const strengthB = calculateTeamStrength(teamB, playersB);
    const possA = possessionProbability(strengthA, strengthB);

    const state: MatchState = {
      minute: 0,
      scoreA: 0,
      scoreB: 0,
      possessionA: 0,
      possessionB: 0,
      shotsA: 0,
      shotsB: 0,
      events: [],
      yellowCardsA: new Map(),
      yellowCardsB: new Map(),
      redCardsA: new Set(),
      redCardsB: new Set(),
      playerStats: new Map(),
    };

    const commentary = createCommentaryEngine({
      homeTeamName: teamA.name,
      awayTeamName: teamB.name,
    });

    const allCommentary: string[] = [];

    for (let minute = 1; minute <= 90; minute++) {
      state.minute = minute;

      // Yield every 15 minutes to avoid blocking
      if (minute % 15 === 0) {
        await Promise.resolve();
      }

      // Determine which team has possession this minute
      const teamHasPossession: TeamSide = rngChance(rng, possA) ? 'A' : 'B';
      if (teamHasPossession === 'A') {
        state.possessionA++;
      } else {
        state.possessionB++;
      }

      const attackingPlayers = teamHasPossession === 'A' ? playersA : playersB;
      const defendingPlayers = teamHasPossession === 'A' ? playersB : playersA;
      const attackingTeam = teamHasPossession === 'A' ? teamA : teamB;

      // OVR advantage modifier
      const attackStrength = teamHasPossession === 'A' ? strengthA : strengthB;
      const defenseStrength = teamHasPossession === 'A' ? strengthB : strengthA;
      const ovrMod = attackStrength / Math.max(defenseStrength, 1);

      // Generate events for this minute
      this.simulateMinute(
        rng, minute, teamHasPossession, attackingPlayers, defendingPlayers,
        attackingTeam, ovrMod, state, commentary
      );

      // Collect commentary
      const newLines = commentary.getNewLines();
      allCommentary.push(...newLines);
    }

    // Calculate final possession percentages
    const totalPoss = state.possessionA + state.possessionB;
    const possessionAPct = totalPoss > 0
      ? Math.round((state.possessionA / totalPoss) * 100)
      : 50;

    // Determine winner
    let winnerId: string | null = null;
    if (state.scoreA > state.scoreB) winnerId = teamA.id;
    else if (state.scoreB > state.scoreA) winnerId = teamB.id;

    // Collect cards
    const cards: MatchResult['cards'] = [];
    for (const event of state.events) {
      if (event.type === 'yellow_card' || event.type === 'red_card') {
        cards.push({ team: event.team, player: event.player, type: event.type });
      }
    }

    // Man of the match
    const mom = determineManOfMatch(state.playerStats as Map<string, { goals: number; assists: number; shots: number; passes: number }>);

    this.logger.info('Match simulation complete', {
      matchId,
      score: `${state.scoreA}-${state.scoreB}`,
      mom,
    });

    return {
      matchId,
      scoreA: state.scoreA,
      scoreB: state.scoreB,
      possessionA: possessionAPct,
      possessionB: 100 - possessionAPct,
      shotsA: state.shotsA,
      shotsB: state.shotsB,
      events: state.events,
      winnerId,
      manOfTheMatch: mom,
      cards,
    };
  }

  private simulateMinute(
    rng: () => number,
    minute: number,
    team: TeamSide,
    attackers: ReadonlyArray<PlayerRecord>,
    defenders: ReadonlyArray<PlayerRecord>,
    attackingTeam: TeamRecord,
    ovrMod: number,
    state: MatchState,
    commentary: CommentaryEngine
  ): void {
    if (attackers.length === 0) return;

    // Pass event
    if (rngChance(rng, BASE_PROBABILITIES.pass * ovrMod)) {
      const passer = pickPlayer(rng, attackers, 'pass');
      const event: MatchEvent = { minute, type: 'pass', team, player: passer.name, position: passer.role };
      state.events.push(event);
      this.updateStats(state, passer.name, 'passes');
      commentary.handleEvent(event, {
        minute, scoreA: state.scoreA, scoreB: state.scoreB,
        homeTeamName: attackingTeam.name, awayTeamName: '',
      });
    }

    // Dribble event
    if (rngChance(rng, BASE_PROBABILITIES.dribble * ovrMod)) {
      const dribbler = pickPlayer(rng, attackers, 'dribble');
      const event: MatchEvent = { minute, type: 'dribble', team, player: dribbler.name, position: dribbler.role };
      state.events.push(event);
      commentary.handleEvent(event, {
        minute, scoreA: state.scoreA, scoreB: state.scoreB,
        homeTeamName: attackingTeam.name, awayTeamName: '',
      });
    }

    // Shot event
    if (rngChance(rng, BASE_PROBABILITIES.shot * ovrMod)) {
      const shooter = pickPlayer(rng, attackers, 'shot');
      const shotEvent: MatchEvent = { minute, type: 'shot', team, player: shooter.name, position: shooter.role };
      state.events.push(shotEvent);
      if (team === 'A') state.shotsA++; else state.shotsB++;
      this.updateStats(state, shooter.name, 'shots');

      commentary.handleEvent(shotEvent, {
        minute, scoreA: state.scoreA, scoreB: state.scoreB,
        homeTeamName: attackingTeam.name, awayTeamName: '',
      });

      // Goal from shot
      if (rngChance(rng, BASE_PROBABILITIES.goal_from_shot * ovrMod)) {
        if (team === 'A') state.scoreA++; else state.scoreB++;

        const goalEvent: MatchEvent = { minute, type: 'goal', team, player: shooter.name, position: shooter.role };
        state.events.push(goalEvent);
        this.updateStats(state, shooter.name, 'goals');

        // Score updated BEFORE commentary
        commentary.handleEvent(goalEvent, {
          minute, scoreA: state.scoreA, scoreB: state.scoreB,
          homeTeamName: attackingTeam.name, awayTeamName: '',
        });
      }
    }

    // Foul event
    if (defenders.length > 0 && rngChance(rng, BASE_PROBABILITIES.foul)) {
      const fouler = pickPlayer(rng, defenders, 'foul');
      const oppositeTeam: TeamSide = team === 'A' ? 'B' : 'A';
      const foulEvent: MatchEvent = { minute, type: 'foul', team: oppositeTeam, player: fouler.name, position: fouler.role };
      state.events.push(foulEvent);
      this.updateStats(state, fouler.name, 'fouls');

      commentary.handleEvent(foulEvent, {
        minute, scoreA: state.scoreA, scoreB: state.scoreB,
        homeTeamName: attackingTeam.name, awayTeamName: '',
      });

      // Card from foul
      const cardMap = oppositeTeam === 'A' ? state.yellowCardsA : state.yellowCardsB;
      const redSet = oppositeTeam === 'A' ? state.redCardsA : state.redCardsB;

      if (!redSet.has(fouler.id)) {
        if (rngChance(rng, BASE_PROBABILITIES.red_from_foul)) {
          redSet.add(fouler.id);
          const cardEvent: MatchEvent = { minute, type: 'red_card', team: oppositeTeam, player: fouler.name, position: fouler.role };
          state.events.push(cardEvent);
          commentary.handleEvent(cardEvent, {
            minute, scoreA: state.scoreA, scoreB: state.scoreB,
            homeTeamName: attackingTeam.name, awayTeamName: '',
          });
        } else if (rngChance(rng, BASE_PROBABILITIES.yellow_from_foul)) {
          const yellows = (cardMap.get(fouler.id) || 0) + 1;
          cardMap.set(fouler.id, yellows);
          const cardType = yellows >= 2 ? 'red_card' : 'yellow_card';
          if (yellows >= 2) redSet.add(fouler.id);
          const cardEvent: MatchEvent = { minute, type: cardType as 'yellow_card' | 'red_card', team: oppositeTeam, player: fouler.name, position: fouler.role };
          state.events.push(cardEvent);
          commentary.handleEvent(cardEvent, {
            minute, scoreA: state.scoreA, scoreB: state.scoreB,
            homeTeamName: attackingTeam.name, awayTeamName: '',
          });
        }
      }
    }
  }

  private updateStats(state: MatchState, player: string, stat: keyof PlayerMatchStats): void {
    if (!state.playerStats.has(player)) {
      state.playerStats.set(player, {
        goals: 0, assists: 0, shots: 0, passes: 0, fouls: 0, yellowCards: 0, redCards: 0,
      });
    }
    const s = state.playerStats.get(player)!;
    (s[stat] as number)++;
  }
}
