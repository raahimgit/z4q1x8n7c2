/**
 * Environment variable validation and configuration.
 * Validates required vars at startup and exports typed config.
 */

export interface AppConfig {
  discordToken: string;
  guildId: string | undefined;
  supabaseUrl: string;
  supabaseKey: string;
  adminUserIds: string[];
  nodeEnv: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  healthPort: number | undefined;
  appName: string;
  sentryDsn: string | undefined;
}

export function loadConfig(): AppConfig {
  const missing: string[] = [];

  const discordToken = process.env.DISCORD_TOKEN;
  if (!discordToken) missing.push('DISCORD_TOKEN');

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) missing.push('SUPABASE_URL');

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const adminRaw = process.env.ADMIN_USER_IDS || '';
  const adminUserIds = adminRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const logLevel = (process.env.LOG_LEVEL || 'info') as AppConfig['logLevel'];
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    throw new Error(`Invalid LOG_LEVEL: ${logLevel}`);
  }

  const healthPortRaw = process.env.HEALTH_PORT;
  const healthPort = healthPortRaw ? parseInt(healthPortRaw, 10) : undefined;
  if (healthPort !== undefined && isNaN(healthPort)) {
    throw new Error(`Invalid HEALTH_PORT: ${healthPortRaw}`);
  }

  return {
    discordToken: discordToken!,
    guildId: process.env.GUILD_ID,
    supabaseUrl: supabaseUrl!,
    supabaseKey: supabaseKey!,
    adminUserIds,
    nodeEnv: process.env.NODE_ENV || 'production',
    logLevel,
    healthPort,
    appName: process.env.APP_NAME || 'El Royale FC',
    sentryDsn: process.env.SENTRY_DSN,
  };
}
