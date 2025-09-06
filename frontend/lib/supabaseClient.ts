import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Do NOT instantiate with empty strings (throws in build/SSR). Export a nullable client instead.
let client: SupabaseClient | null = null;
if (url && anon) {
  client = createClient(url, anon);
} else if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn('Supabase env missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = client as unknown as SupabaseClient;
export function hasSupabaseConfig() {
  return Boolean(url && anon);
}
