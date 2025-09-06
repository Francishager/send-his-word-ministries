import { supabase } from './supabaseClient';

// Upload a file to Supabase Storage and return its public URL.
// If userId is provided, object keys are prefixed with `${userId}/` to satisfy folder-based RLS policies.
export async function uploadToSupabase(file: File, pathPrefix = 'uploads', userId?: string): Promise<string> {
  if (!file) throw new Error('No file provided');
  const bucket = 'public-media';
  const ext = file.name.split('.').pop() || 'bin';
  const basePrefix = userId ? `${userId}/${pathPrefix}` : pathPrefix;
  const key = `${basePrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(key, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  if (!data?.publicUrl) throw new Error('Could not get public URL');
  return data.publicUrl;
}
