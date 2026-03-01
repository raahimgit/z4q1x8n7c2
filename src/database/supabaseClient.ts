/**
 * Supabase client for the Discord bot (server-side).
 * Uses service role key for full access.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from '../config/env';

let clientInstance: SupabaseClient | null = null;

export function createSupabaseClient(config: AppConfig): SupabaseClient {
  if (clientInstance) return clientInstance;

  clientInstance = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return clientInstance;
}

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient first.');
  }
  return clientInstance;
}

export type { SupabaseClient };
