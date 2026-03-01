/**
 * /team command — view team info and roster.
 */
import type { CommandContext } from '../bot/commandHandler';
import type { TeamService } from '../services/TeamService';
import type { Logger } from '../utils/logger';

export function createTeamHandler(teamService: TeamService, logger: Logger) {
  return async (ctx: CommandContext): Promise<void> => {
    try {
      const team = await teamService.getTeamByUser(ctx.userId);
      if (!team) {
        await ctx.reply('You don\'t have a team yet. Use `/join` to create one.', true);
        return;
      }

      const players = await teamService.getPlayers(team.id);
      const activeXI = await teamService.getActiveXI(team.id, team.activeLineup);

      const rosterLines = players.map((p) => {
        const active = activeXI.some((a) => a.id === p.id) ? '⭐' : '  ';
        return `${active} ${p.name} | ${p.role} | OVR ${p.rating}`;
      });

      const info = [
        `**${team.name}**`,
        `📊 OVR: ${team.ovr} | Formation: ${team.formation}`,
        `⚔️ Tactic: ${team.tactic}`,
        `💪 Stamina: ${team.stamina}`,
        '',
        '**Roster** (⭐ = Active XI):',
        ...rosterLines,
      ];

      await ctx.reply(info.join('\n'));
    } catch (err) {
      logger.error('Team command failed', { error: String(err) });
      await ctx.reply('Failed to load team info.', true);
    }
  };
}
