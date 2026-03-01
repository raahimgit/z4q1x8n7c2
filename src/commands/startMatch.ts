/**
 * /startmatch command — initiates a match between two players.
 */
import type { CommandContext } from '../bot/commandHandler';
import type { MatchService } from '../services/MatchService';
import type { TeamService } from '../services/TeamService';
import type { MilestoneService } from '../services/MilestoneService';
import type { Logger } from '../utils/logger';
import type { MatchSetup } from '../types/global';

export function createStartMatchHandler(
  matchService: MatchService,
  teamService: TeamService,
  milestoneService: MilestoneService,
  logger: Logger
) {
  return async (ctx: CommandContext): Promise<void> => {
    await ctx.deferReply();

    const opponentId = ctx.options.get('opponent') as string;
    const isRanked = (ctx.options.get('ranked') as boolean) || false;

    if (!opponentId) {
      await ctx.editReply('Please specify an opponent.');
      return;
    }

    if (opponentId === ctx.userId) {
      await ctx.editReply('You cannot play against yourself.');
      return;
    }

    try {
      const teamA = await teamService.getTeamByUser(ctx.userId);
      const teamB = await teamService.getTeamByUser(opponentId);

      if (!teamA) {
        await ctx.editReply('You don\'t have a team yet. Use /join to create one.');
        return;
      }

      if (!teamB) {
        await ctx.editReply('Your opponent doesn\'t have a team yet.');
        return;
      }

      const playersA = await teamService.getActiveXI(teamA.id, teamA.activeLineup);
      const playersB = await teamService.getActiveXI(teamB.id, teamB.activeLineup);

      if (playersA.length === 0 || playersB.length === 0) {
        await ctx.editReply('Both teams need at least one player to start a match.');
        return;
      }

      const matchId = crypto.randomUUID();

      const setup: MatchSetup = {
        matchId,
        teamA,
        teamB,
        playersA,
        playersB,
        isRanked,
      };

      const summary = await matchService.runMatch(setup);

      // Format match report
      const report = [
        `**Match Report — ${teamA.name} ${summary.scoreA} — ${summary.scoreB} ${teamB.name}**`,
        '',
        `⚽ Shots: ${summary.shotsA} — ${summary.shotsB}`,
        `📊 Possession: ${summary.possessionA}% — ${summary.possessionB}%`,
        `🏅 Man of the Match: ${summary.manOfTheMatch}`,
        `🏷️ ${isRanked ? 'Ranked' : 'Unranked'} | ID: \`${matchId.slice(0, 8)}\``,
      ];

      if (summary.cards.length > 0) {
        report.push('');
        report.push('**Cards:**');
        for (const card of summary.cards) {
          const emoji = card.type === 'red_card' ? '🟥' : '🟨';
          report.push(`${emoji} ${card.player} (Team ${card.team})`);
        }
      }

      await ctx.editReply(report.join('\n'));

      // Check milestones for ranked matches
      if (isRanked) {
        try {
          const milestonesA = await milestoneService.checkAndApplyMilestones(teamA.id, 0, playersA);
          const milestonesB = await milestoneService.checkAndApplyMilestones(teamB.id, 0, playersB);

          for (const m of [...milestonesA, ...milestonesB]) {
            if (m.applied && m.appliedTo.length > 0) {
              const lines = m.appliedTo.map((a) =>
                `• ${a.position}: +${a.delta} OVR${a.pending ? ` (${a.pending} pending)` : ''}`
              );
              await ctx.followUp(`🎯 **Milestone ${m.milestone} Unlocked!**\n${lines.join('\n')}`);
            }
          }
        } catch (err) {
          logger.error('Milestone check failed', { error: String(err) });
        }
      }
    } catch (err) {
      logger.error('Match failed', { error: String(err) });
      await ctx.editReply(`Match failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
}
