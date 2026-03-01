/**
 * Discord.js client setup for El Royale FC bot.
 * discord.js is a runtime dependency — install via npm in deployment environment.
 */

export interface BotClient {
  login(token: string): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * Placeholder client factory.
 * In deployment, replace with actual discord.js usage:
 *
 * ```ts
 * import { Client, GatewayIntentBits } from 'discord.js';
 * const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 * ```
 */
export function createBotClient(): BotClient {
  let clientRef: { destroy: () => Promise<void> } | null = null;

  return {
    async login(token: string): Promise<void> {
      // Dynamic import to avoid compile errors when discord.js isn't installed
      const discordJs = await (Function('return import("discord.js")')() as Promise<Record<string, unknown>>);
      const ClientClass = discordJs.Client as new (opts: unknown) => { login: (t: string) => Promise<string>; destroy: () => Promise<void>; on: (e: string, cb: (...args: unknown[]) => void) => void };
      const GatewayIntentBits = discordJs.GatewayIntentBits as Record<string, number>;

      const client = new ClientClass({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
      });

      await client.login(token);
      clientRef = client;
    },
    async destroy(): Promise<void> {
      if (clientRef) await clientRef.destroy();
    },
  };
}
