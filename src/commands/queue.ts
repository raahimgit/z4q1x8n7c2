/**
 * /ranked and /unranked commands — join matchmaking queue.
 */
import type { CommandContext } from '../bot/commandHandler';
import type { QueueService } from '../services/QueueService';
import type { TeamService } from '../services/TeamService';
import type { MatchService } from '../services/MatchService';
import type { Logger } from '../utils/logger';

export function createQueueHandler(
  queueService: QueueService,
  teamService: TeamService,
  matchService: MatchService,
  logger: Logger,
  kind: 'ranked' | 'unranked'
) {
  return async (ctx: CommandContext): Promise<void> => {
    await ctx.deferReply();

    try {
      const team = await teamService.getTeamByUser(ctx.userId);
      if (!team) {
        await ctx.editReply('You need a team first. Use `/join` to create one.');
        return;
      }

      await queueService.joinQueue(ctx.userId, kind);

      // Try to find an opponent
      const opponent = await queueService.findOpponent(ctx.userId, kind);

      if (opponent) {
        // Match found — remove both from queue and start match
        await queueService.removeBothFromQueue(ctx.userId, opponent.ownerId);

        const opponentTeam = await teamService.getTeamByUser(opponent.ownerId);
        if (!opponentTeam) {
          await ctx.editReply('Opponent\'s team not found. Returning to queue.');
          return;
        }

        const playersA = await teamService.getActiveXI(team.id, team.activeLineup);
        const playersB = await teamService.getActiveXI(opponentTeam.id, opponentTeam.activeLineup);

        const matchId = crypto.randomUUID();

        const summary = await matchService.runMatch({
          matchId,
          teamA: team,
          teamB: opponentTeam,
          playersA,
          playersB,
          isRanked: kind === 'ranked',
        });

        await ctx.editReply(
          `⚔️ **Match Found!**\n` +
          `**${team.name} ${summary.scoreA} — ${summary.scoreB} ${opponentTeam.name}**\n` +
          `📊 Possession: ${summary.possessionA}% — ${summary.possessionB}%\n` +
          `⚽ Shots: ${summary.shotsA} — ${summary.shotsB}\n` +
          `🏅 MOM: ${summary.manOfTheMatch}`
        );
      } else {
        await ctx.editReply(`🔍 You've joined the ${kind} queue. Waiting for an opponent...`);
      }
    } catch (err) {
      logger.error('Queue command failed', { error: String(err) });
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await ctx.editReply(`Failed: ${msg}`);
    }
  };
}
