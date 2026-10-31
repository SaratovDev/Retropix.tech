import { supabase } from './supabase';

// === Типы ===
export type GameType =
  | 'memory'
  | 'labyrinth-4x4'
  | 'labyrinth-6x6'
  | 'labyrinth-8x8';

export interface LeaderboardEntry {
  id: string;
  game: GameType;
  nickname: string;
  time: number;
  moves: number | null;
  errors: number | null;
  created_at: string;
}

export interface ScoresPage {
  entries: LeaderboardEntry[];
  total: number;
}

// === Отправка результата ===
export async function submitScore(params: {
  game: GameType;
  nickname?: string;
  time: number;
  moves?: number;
  errors?: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Лидерборд временно недоступен' };
  }

  const { game, nickname, time, moves, errors } = params;

  if (time <= 0 || time >= 3600) {
    return { success: false, error: 'Некорректное время' };
  }

  const { error } = await supabase.from('leaders').insert({
    game,
    nickname: nickname?.trim().slice(0, 30) || 'Аноним',
    time: Math.round(time * 100) / 100,
    moves: moves ?? null,
    errors: errors ?? null,
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// === Получение страницы результатов + общее количество ===
export async function getScores(
  game: GameType,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<ScoresPage> {
  if (!supabase) {
    return { entries: [], total: 0 };
  }

  const { data, error, count } = await supabase
    .from('leaders')
    .select('id, game, nickname, time, moves, errors, created_at', {
      count: 'exact',
    })
    .eq('game', game)
    .order('time', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Supabase select error:', error);
    return { entries: [], total: 0 };
  }

  return {
    entries: (data ?? []) as LeaderboardEntry[],
    total: count ?? 0,
  };
}

// === Место игрока в общем зачёте (1-based) ===
export async function getPlayerRank(
  game: GameType,
  time: number
): Promise<number | null> {
  if (!supabase) return null;

  const { count, error } = await supabase
    .from('leaders')
    .select('*', { count: 'exact', head: true })
    .eq('game', game)
    .lt('time', time);

  if (error) {
    console.error('Supabase count error:', error);
    return null;
  }

  return (count ?? 0) + 1;
}