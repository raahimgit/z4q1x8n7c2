/**
 * /join command — create a new team.
 */
import type { CommandContext } from '../bot/commandHandler';
import type { TeamService } from '../services/TeamService';
import type { Logger } from '../utils/logger';

export function createCreateTeamHandler(teamService: TeamService, logger: Logger) {
  return async (ctx: CommandContext): Promise<void> => {
    const teamName = ctx.options.get('team_name') as string;

    if (!teamName || teamName.trim().length === 0) {
      await ctx.reply('Please provide a team name.', true);
      return;
    }

    if (teamName.length > 32) {
      await ctx.reply('Team name must be 32 characters or fewer.', true);
      return;
    }

    try {
      const team = await teamService.createTeam(ctx.userId, teamName.trim());
      await ctx.reply(
        `✅ **${team.name}** has been created! Welcome to El Royale FC.\n` +
        `Use \`/team\` to view your roster and \`/formation\` to set your formation.`
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes('already have a team')) {
        await ctx.reply('You already have a team.', true);
      } else {
        logger.error('Create team failed', { error: String(err) });
        await ctx.reply('Failed to create team. Please try again.', true);
      }
    }
  };
}
