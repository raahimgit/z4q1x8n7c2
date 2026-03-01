/**
 * TeamService — business logic for team operations.
 */
import type { SupabaseClient } from '../database/supabaseClient';
import type { TeamRecord, PlayerRecord } from '../types/global';
import { AppError } from '../types/global';
import * as TeamModel from '../models/TeamModel';
import * as PlayerModel from '../models/PlayerModel';
import type { Logger } from '../utils/logger';

export class TeamService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger
  ) {}

  /** Get team by Discord user ID */
  async getTeamByUser(userId: string): Promise<TeamRecord | null> {
    return TeamModel.getTeamByOwnerId(this.supabase, userId);
  }

  /** Get team by team ID */
  async getTeamById(teamId: string): Promise<TeamRecord | null> {
    return TeamModel.getTeamById(this.supabase, teamId);
  }

  /** Create a new team for a user */
  async createTeam(userId: string, teamName: string): Promise<TeamRecord> {
    const existing = await this.getTeamByUser(userId);
    if (existing) {
      throw new AppError('TEAM_EXISTS', 'You already have a team.');
    }
    this.logger.info('Creating team', { userId, teamName });
    return TeamModel.createTeam(this.supabase, userId, teamName);
  }

  /** Get players for a team */
  async getPlayers(teamId: string): Promise<PlayerRecord[]> {
    return PlayerModel.getPlayersByTeamId(this.supabase, teamId);
  }

  /** Get active XI for a team */
  async getActiveXI(teamId: string, activeLineup: string[]): Promise<PlayerRecord[]> {
    return PlayerModel.getActiveXI(this.supabase, teamId, activeLineup);
  }

  /** Calculate and update team OVR based on active players */
  async recalculateOvr(teamId: string, activeLineup: string[]): Promise<number> {
    const players = await this.getActiveXI(teamId, activeLineup);
    if (players.length === 0) return 0;
    const avg = players.reduce((sum, p) => sum + p.rating, 0) / players.length;
    const rounded = Math.round(avg * 10) / 10;
    await TeamModel.updateTeamOvr(this.supabase, teamId, rounded);
    return rounded;
  }
}
