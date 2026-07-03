import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isRealSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock reactions system using localStorage if Supabase is offline/unconfigured
class LocalStorageReactions {
  private getStorageKey(book: string, chapter: string): string {
    return `ft_reactions_${book.toUpperCase()}_${chapter}`;
  }

  async getReactions(book: string, chapter: string): Promise<number> {
    await new Promise((r) => setTimeout(r, 80)); // simulate network delay
    const val = localStorage.getItem(this.getStorageKey(book, chapter));
    return val ? Number(val) : 0;
  }

  async addReaction(book: string, chapter: string): Promise<number> {
    await new Promise((r) => setTimeout(r, 80));
    const key = this.getStorageKey(book, chapter);
    const val = localStorage.getItem(key);
    const nextVal = (val ? Number(val) : 0) + 1;
    localStorage.setItem(key, String(nextVal));
    return nextVal;
  }
}

const localFallback = new LocalStorageReactions();

export async function fetchReactionCount(book: string, chapter: string): Promise<number> {
  if (isRealSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('count')
        .eq('book', book.toUpperCase())
        .eq('chapter', chapter)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return 0; // Row doesn't exist yet
        }
        throw error;
      }
      return data?.count || 0;
    } catch (e) {
      console.warn("Supabase fetch failed, using fallback:", e);
      return localFallback.getReactions(book, chapter);
    }
  } else {
    return localFallback.getReactions(book, chapter);
  }
}

export async function incrementReactionCount(book: string, chapter: string): Promise<number> {
  const spamKey = `ft_reacted_${book.toUpperCase()}_${chapter}`;
  if (localStorage.getItem(spamKey)) {
    return fetchReactionCount(book, chapter); // already reacted, get count only
  }

  localStorage.setItem(spamKey, 'true');

  if (isRealSupabase && supabase) {
    try {
      // Try to increment via RPC function first
      const { data, error } = await supabase.rpc('increment_reaction', {
        book_code: book.toUpperCase(),
        chapter_code: chapter
      });
      if (!error && data !== null) {
        return Number(data);
      }
      
      // Fallback: fetch + upsert
      const current = await fetchReactionCount(book, chapter);
      const next = current + 1;
      const { error: upsertError } = await supabase
        .from('reactions')
        .upsert({ book: book.toUpperCase(), chapter, count: next }, { onConflict: 'book,chapter' });
      
      if (upsertError) throw upsertError;
      return next;
    } catch (e) {
      console.warn("Supabase increment failed, using fallback:", e);
      return localFallback.addReaction(book, chapter);
    }
  } else {
    return localFallback.addReaction(book, chapter);
  }
}

export function hasReacted(book: string, chapter: string): boolean {
  return !!localStorage.getItem(`ft_reacted_${book.toUpperCase()}_${chapter}`);
}
