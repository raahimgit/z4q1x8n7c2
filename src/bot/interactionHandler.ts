/**
 * Interaction handler — bridges discord.js interactions to CommandRegistry.
 * This file contains the discord.js-specific interaction handling logic.
 *
 * In deployment, wire this up in the client's 'interactionCreate' event.
 */
import type { CommandRegistry, CommandContext } from './commandHandler';
import type { Logger } from '../utils/logger';

/**
 * Creates a handler function for discord.js interactionCreate events.
 * Usage with discord.js:
 *
 * ```ts
 * client.on('interactionCreate', createInteractionHandler(registry, logger));
 * ```
 */
export function createInteractionHandler(
  registry: CommandRegistry,
  logger: Logger
): (interaction: unknown) => Promise<void> {
  return async (interaction: unknown): Promise<void> => {
    // Type guard for ChatInputCommandInteraction
    const inter = interaction as {
      isChatInputCommand?: () => boolean;
      commandName?: string;
      user?: { id: string };
      guildId?: string | null;
      options?: { data?: Array<{ name: string; value: string | number | boolean }> };
      reply?: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
      deferReply?: (opts?: { ephemeral?: boolean }) => Promise<void>;
      followUp?: (opts: { content: string }) => Promise<void>;
      editReply?: (opts: { content: string }) => Promise<void>;
    };

    if (!inter.isChatInputCommand || !inter.isChatInputCommand()) return;

    const commandName = inter.commandName || '';
    const userId = inter.user?.id || '';
    const guildId = inter.guildId || null;

    const options = new Map<string, string | number | boolean>();
    for (const opt of inter.options?.data || []) {
      options.set(opt.name, opt.value);
    }

    const ctx: CommandContext = {
      userId,
      guildId,
      options,
      reply: async (content: string, ephemeral?: boolean) => {
        await inter.reply?.({ content, ephemeral: ephemeral || false });
      },
      deferReply: async (ephemeral?: boolean) => {
        await inter.deferReply?.({ ephemeral: ephemeral || false });
      },
      followUp: async (content: string) => {
        await inter.followUp?.({ content });
      },
      editReply: async (content: string) => {
        await inter.editReply?.({ content });
      },
    };

    logger.debug('Handling interaction', { command: commandName, userId });
    await registry.execute(commandName, ctx);
  };
}
