/**
 * Bot entry point — El Royale FC Discord Bot.
 * Run with: npx ts-node src/index.ts (in deployment environment with discord.js installed)
 */

// Entry point for the bot — this file is NOT used by the Vite/React app.
// Deploy separately to a Node.js environment.

export async function startBot(): Promise<void> {
  // Load env
  const { loadConfig } = await import('./config/env');
  const config = loadConfig();

  // Create logger
  const { createLogger } = await import('./utils/logger');
  const logger = createLogger(config.logLevel);

  logger.info('Starting El Royale FC bot', { appName: config.appName, env: config.nodeEnv });

  // Initialize Supabase
  const { createSupabaseClient } = await import('./database/supabaseClient');
  const supabase = createSupabaseClient(config);

  // Initialize services
  const { TeamService } = await import('./services/TeamService');
  const { MatchService } = await import('./services/MatchService');
  const { QueueService } = await import('./services/QueueService');
  const { LeaderboardService } = await import('./services/LeaderboardService');
  const { MilestoneService } = await import('./services/MilestoneService');

  const teamService = new TeamService(supabase, logger);
  const matchService = new MatchService(supabase, logger);
  const queueService = new QueueService(supabase, logger);
  const leaderboardService = new LeaderboardService(supabase, logger);
  const milestoneService = new MilestoneService(supabase, logger);

  // Register command handlers
  const { CommandRegistry } = await import('./bot/commandHandler');
  const registry = new CommandRegistry(logger);

  const { createCreateTeamHandler } = await import('./commands/createTeam');
  const { createTeamHandler } = await import('./commands/team');
  const { createStartMatchHandler } = await import('./commands/startMatch');
  const { createQueueHandler } = await import('./commands/queue');
  const { createLeaderboardHandler, createProfileHandler } = await import('./commands/leaderboard');

  registry.register('join', createCreateTeamHandler(teamService, logger));
  registry.register('team', createTeamHandler(teamService, logger));
  registry.register('startmatch', createStartMatchHandler(matchService, teamService, milestoneService, logger));
  registry.register('ranked', createQueueHandler(queueService, teamService, matchService, logger, 'ranked'));
  registry.register('unranked', createQueueHandler(queueService, teamService, matchService, logger, 'unranked'));
  registry.register('leaderboard', createLeaderboardHandler(leaderboardService, logger));
  registry.register('profile', createProfileHandler(leaderboardService, logger));

  logger.info('All commands registered', { commands: registry.getRegisteredCommands() });

  // Start Discord client
  const { createBotClient } = await import('./bot/client');
  const bot = createBotClient();
  await bot.login(config.discordToken);

  logger.info('Bot is online');

  // Optional health check
  if (config.healthPort) {
    const http = await import('http');
    const server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end('OK');
    });
    server.listen(config.healthPort, () => {
      logger.info('Health check server started', { port: config.healthPort });
    });
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await bot.destroy();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Auto-start when run directly (not in Vite)
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('index')) {
  startBot().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
