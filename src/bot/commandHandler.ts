/**
 * Command handler — maps slash command names to handler functions.
 */
import type { Logger } from '../utils/logger';

export interface CommandContext {
  userId: string;
  guildId: string | null;
  options: Map<string, string | number | boolean>;
  reply: (content: string, ephemeral?: boolean) => Promise<void>;
  deferReply: (ephemeral?: boolean) => Promise<void>;
  followUp: (content: string) => Promise<void>;
  editReply: (content: string) => Promise<void>;
}

export type CommandHandler = (ctx: CommandContext) => Promise<void>;

export class CommandRegistry {
  private readonly handlers = new Map<string, CommandHandler>();

  constructor(private readonly logger: Logger) {}

  register(name: string, handler: CommandHandler): void {
    this.handlers.set(name, handler);
    this.logger.debug('Registered command', { name });
  }

  async execute(name: string, ctx: CommandContext): Promise<void> {
    const handler = this.handlers.get(name);
    if (!handler) {
      await ctx.reply('Unknown command.', true);
      return;
    }

    try {
      await handler(ctx);
    } catch (err) {
      this.logger.error('Command execution error', {
        command: name,
        userId: ctx.userId,
        error: String(err),
      });
      try {
        await ctx.reply(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`, true);
      } catch {
        // Interaction may have expired
      }
    }
  }

  getRegisteredCommands(): string[] {
    return [...this.handlers.keys()];
  }
}
