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

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in ms

export async function getCurriculumCache(): Promise<any[] | null> {
  const localKey = 'ft_lessons_cache';
  const localTimeKey = 'ft_lessons_cache_time';

  if (isRealSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('lessons_cache')
        .select('*');
      
      if (!error && data && data.length > 0) {
        const first = data[0];
        if (first && first.updated_at) {
          const cacheTime = new Date(first.updated_at).getTime();
          if (Date.now() - cacheTime < CACHE_EXPIRY) {
            return data;
          }
        }
      }
    } catch (e) {
      console.warn("Supabase lessons cache read failed:", e);
    }
  }

  try {
    const cachedTime = localStorage.getItem(localTimeKey);
    const cachedData = localStorage.getItem(localKey);
    if (cachedTime && cachedData) {
      if (Date.now() - Number(cachedTime) < CACHE_EXPIRY) {
        return JSON.parse(cachedData);
      }
    }
  } catch (e) {
    console.warn("localStorage cache read failed:", e);
  }

  return null;
}

export async function saveCurriculumCache(data: any[]): Promise<void> {
  const localKey = 'ft_lessons_cache';
  const localTimeKey = 'ft_lessons_cache_time';

  try {
    localStorage.setItem(localKey, JSON.stringify(data));
    localStorage.setItem(localTimeKey, String(Date.now()));
  } catch (e) {
    console.warn("localStorage cache write failed:", e);
  }

  if (isRealSupabase && supabase) {
    try {
      const rows = data.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        image: item.image,
        shortDescription: item.shortDescription,
        description: item.description,
        videoEmbedUrl: item.videoEmbedUrl,
        live: item.live,
        aboutSection: item.aboutSection,
        age: item.age,
        sort: item.sort,
        updated_at: new Date().toISOString()
      }));

      await supabase.from('lessons_cache').delete().neq('id', 'placeholder');
      const { error } = await supabase.from('lessons_cache').insert(rows);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase lessons cache write failed:", e);
    }
  }
}

export async function fetchCustomVerse(): Promise<string | null> {
  const localKey = 'ft_custom_verse';

  if (isRealSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'verse_of_the_week')
        .single();
      
      if (!error && data) {
        return data.value;
      }
    } catch (e) {
      console.warn("Supabase custom verse fetch failed, using local storage:", e);
    }
  }

  return localStorage.getItem(localKey);
}

export async function updateCustomVerse(passageId: string): Promise<void> {
  const localKey = 'ft_custom_verse';
  localStorage.setItem(localKey, passageId);

  if (isRealSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'verse_of_the_week', value: passageId }, { onConflict: 'key' });
      
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase custom verse update failed:", e);
    }
  }
}

export interface BibleStudyNote {
  ref: string;
  usfm_start: string | null;
  usfm_end?: string | null;
  title: string;
  content_html: string;
  acai?: any[];
  related_resources?: any[];
  review_level: string;
  language?: string;
  source_version?: string;
}

const USFM_BOOK_ORDER = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
  'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
  'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
  '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

export async function fetchStudyNotesForChapter(book: string, chapter: string): Promise<BibleStudyNote[]> {
  const normalizedBook = book.toUpperCase();
  
  if (isRealSupabase && supabase) {
    try {
      const prefix = `${normalizedBook} ${chapter}`;
      const { data, error } = await supabase
        .from('bible_study_notes')
        .select('*')
        .or(`usfm_start.eq.${prefix},usfm_start.like.${prefix}:%`);
        
      if (error) throw error;
      if (data && data.length > 0) {
        return data.sort((a, b) => a.ref.localeCompare(b.ref));
      }
    } catch (e) {
      console.warn("Supabase fetchStudyNotesForChapter failed, falling back to local files:", e);
    }
  }

  // Local JSON files fallback (Vite public/bible-study-notes/ directory)
  try {
    const bookIndex = USFM_BOOK_ORDER.indexOf(normalizedBook);
    if (bookIndex !== -1) {
      const bookNumber = String(bookIndex + 1).padStart(2, '0');
      const response = await fetch(`/bible-study-notes/${bookNumber}.json`);
      if (response.ok) {
        const data = (await response.json()) as BibleStudyNote[];
        
        // Filter locally by usfm_start prefix
        const prefix = `${normalizedBook} ${chapter}`;
        const filtered = data.filter((note) => {
          if (!note.usfm_start) return false;
          return note.usfm_start === prefix || note.usfm_start.startsWith(`${prefix}:`);
        });
        
        return filtered.sort((a, b) => a.ref.localeCompare(b.ref));
      }
    }
  } catch (e) {
    console.warn("Failed to load local study notes cache:", e);
  }

  return [];
}


