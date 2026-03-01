/**
 * Slash command registration for discord.js v14.
 */

export interface SlashCommandDef {
  name: string;
  description: string;
  options?: Array<{
    name: string;
    description: string;
    type: number;
    required?: boolean;
    choices?: Array<{ name: string; value: string }>;
  }>;
}

export const COMMANDS: SlashCommandDef[] = [
  { name: 'join', description: 'Create your team and join El Royale FC', options: [{ name: 'team_name', description: 'Name for your team', type: 3, required: true }] },
  { name: 'team', description: 'View your team info and roster' },
  { name: 'startmatch', description: 'Start a match against another player', options: [{ name: 'opponent', description: 'The opponent user', type: 6, required: true }, { name: 'ranked', description: 'Ranked match?', type: 5, required: false }] },
  { name: 'ranked', description: 'Join the ranked matchmaking queue' },
  { name: 'unranked', description: 'Join the unranked matchmaking queue' },
  { name: 'leaderboard', description: 'View the top players leaderboard' },
  { name: 'profile', description: 'View your profile and stats' },
  { name: 'formation', description: 'Set your team formation', options: [{ name: 'formation', description: 'Formation string (DEF-MID-ST, sum=10)', type: 3, required: true }] },
  { name: 'tactics', description: 'View or set your team tactics', options: [{ name: 'action', description: 'view or set', type: 3, required: true, choices: [{ name: 'View', value: 'view' }, { name: 'Set', value: 'set' }] }] },
  { name: 'host', description: '[Admin] Host a tournament', options: [{ name: 'name', description: 'Tournament name', type: 3, required: true }] },
  { name: 'start', description: '[Admin] Start a tournament early' },
  { name: 'giveaway', description: '[Admin] Give OVR increment to a user', options: [{ name: 'user', description: 'Target user', type: 6, required: true }, { name: 'amount', description: 'OVR amount', type: 10, required: true }] },
  { name: 'reset', description: '[Admin] Reset a user or season data' },
];

/**
 * Register commands via Discord REST API.
 * Usage in deployment: `npx ts-node src/commands/register.ts`
 */
export async function registerCommands(
  token: string,
  applicationId: string,
  guildId?: string
): Promise<void> {
  const discordJs = await (Function('return import("discord.js")')() as Promise<Record<string, unknown>>);
  const RESTClass = discordJs.REST as new (opts: { version: string }) => { setToken: (t: string) => { put: (route: string, opts: { body: unknown }) => Promise<unknown> } };
  const Routes = discordJs.Routes as { applicationGuildCommands: (a: string, g: string) => string; applicationCommands: (a: string) => string };

  const rest = new RESTClass({ version: '10' }).setToken(token);
  const route = guildId
    ? Routes.applicationGuildCommands(applicationId, guildId)
    : Routes.applicationCommands(applicationId);

  await rest.put(route, { body: COMMANDS });
}
