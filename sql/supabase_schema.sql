-- El Royale FC — Supabase Schema
-- Tables that already exist: teams, players, match_history, match_queue, ratings,
-- seasons, tournaments, tournament_participants, active_matches, command_cooldowns,
-- currency, inventory, rank_claims, season_snapshots, users

-- New tables required by the bot:

CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL,
  minute integer NOT NULL,
  type text NOT NULL CHECK (type IN ('pass','dribble','shot','goal','foul','yellow_card','red_card')),
  team text NOT NULL CHECK (team IN ('A', 'B')),
  player text NOT NULL,
  position text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);

CREATE TABLE IF NOT EXISTS public.milestone_pending_increments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL,
  pending_amount numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestone_pending_player ON public.milestone_pending_increments(player_id);

CREATE TABLE IF NOT EXISTS public.milestone_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id text NOT NULL,
  milestone integer NOT NULL,
  season_id uuid,
  claimed_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestone_history_owner ON public.milestone_history(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_history_unique ON public.milestone_history(owner_id, milestone, season_id);
