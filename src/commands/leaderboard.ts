/**
 * /leaderboard and /profile commands.
 */
import type { CommandContext } from '../bot/commandHandler';
import type { LeaderboardService } from '../services/LeaderboardService';
import type { Logger } from '../utils/logger';

export function createLeaderboardHandler(leaderboardService: LeaderboardService, logger: Logger) {
  return async (ctx: CommandContext): Promise<void> => {
    try {
      const entries = await leaderboardService.getTopByStars(10);

      if (entries.length === 0) {
        await ctx.reply('No rankings yet. Play some matches!');
        return;
      }

      const lines = entries.map((e) =>
        `**${e.rank}.** ${e.teamName} — ⭐ ${e.stars} | OVR ${e.ovr}`
      );

      await ctx.reply(`🏆 **Leaderboard**\n\n${lines.join('\n')}`);
    } catch (err) {
      logger.error('Leaderboard failed', { error: String(err) });
      await ctx.reply('Failed to load leaderboard.', true);
    }
  };
}

export function createProfileHandler(leaderboardService: LeaderboardService, logger: Logger) {
  return async (ctx: CommandContext): Promise<void> => {
    try {
      const profile = await leaderboardService.getUserProfile(ctx.userId);

      if (!profile) {
        await ctx.reply('You don\'t have a team yet. Use `/join` to create one.', true);
        return;
      }

      const info = [
        `**${profile.teamName}**`,
        `📊 OVR: ${profile.ovr} | ⭐ Stars: ${profile.stars}`,
        `🏟️ Matches: ${profile.matchesPlayed}`,
        `✅ W: ${profile.wins} | 🤝 D: ${profile.draws} | ❌ L: ${profile.losses}`,
      ];

      await ctx.reply(info.join('\n'));
    } catch (err) {
      logger.error('Profile failed', { error: String(err) });
      await ctx.reply('Failed to load profile.', true);
    }
  };
}
