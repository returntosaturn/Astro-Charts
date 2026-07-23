import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Supabase is optional: the chart generator works fully offline. Only the
// Save / Saved Charts features need it, so we skip the client entirely when
// the env vars are absent (e.g. Codespaces / local runs without a .env).
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export interface SavedChart {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  location_name: string;
  chart_data: BirthChartRow;
  created_at: string;
}

export interface BirthChartRow {
  planets: Array<{
    name: string;
    longitude: number;
    longitudeText: string;
    sign: number;
    degreeInSign: number;
    retrograde: boolean;
    speed: number;
  }>;
  houses: Array<{
    number: number;
    longitude: number;
    longitudeText: string;
    sign: number;
    degreeInSign: number;
  }>;
  ascendant: number;
  ascendantText: string;
  midheaven: number;
  midheavenText: string;
  aspects: Array<{
    planetA: string;
    planetB: string;
    aspectName: string;
    aspectSymbol: string;
    aspectColor: string;
    aspectDashed: boolean;
    orb: number;
    exact: number;
  }>;
  sunSignIndex: number;
  moonSignIndex: number;
  risingSignIndex: number;
}
