import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Не бросаем при импорте: если переменных нет (PR preview, локальный билд
// без .env), сборка должна проходить, а фича — деградировать в рантайме.
// Иначе падает весь сайт, а не только лидерборд.

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  // Один warning при импорте — полезно видеть в логах Vercel
  console.warn(
    '[supabase] PUBLIC_SUPABASE_URL или PUBLIC_SUPABASE_ANON_KEY не заданы. ' +
      'Лидерборд будет недоступен.'
  );
}