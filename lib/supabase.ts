import { createClient } from '@supabase/supabase-js';
import { StaffMember, AuditLogEntry, StaffRole, ZoneScope, DbContentItem, VotdOverride, BibleVersion, DbBroadcastStatus } from '../types';

// Initialize mock data collections in localStorage if empty for local dev fallbacks
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('ft_mock_staff')) {
    const initialStaff: StaffMember[] = [
      {
        id: 'mock-super-admin-id',
        email: 'admin@faithtribe.com',
        full_name: 'System Administrator',
        role: 'super_admin',
        scoped_zone: null,
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('ft_mock_staff', JSON.stringify(initialStaff));
  }

  if (!localStorage.getItem('ft_mock_audit_log')) {
    localStorage.setItem('ft_mock_audit_log', JSON.stringify([]));
  }

  if (!localStorage.getItem('ft_mock_content_items')) {
    // Seed with initial Kids Zone items from weeklyFunConfig to ensure zero initial content gap
    const initialContent: DbContentItem[] = [
      {
        id: 'kids-1',
        zone: 'kids',
        type: 'video',
        title: 'Meet Your New Best Friend',
        description: 'Who is Jesus and why does He love you so much? Watch this cute cartoon video to learn more!',
        thumbnail_url: 'https://picsum.photos/seed/jesuslove/400/250',
        video_source: 'youtube',
        video_id: 'qH5HIPl0hRo',
        duration: '5:24',
        status: 'published',
        publish_date: new Date().toISOString()
      },
      {
        id: 'kids-2',
        zone: 'kids',
        type: 'reading',
        title: 'David and Goliath: Tiny Courage',
        description: 'Learn how David faced the giant with God\'s help! Read the interactive story inside.',
        thumbnail_url: 'https://picsum.photos/seed/david/400/250',
        story_content: `# David and Goliath: Tiny Courage\n\nA long, long time ago, in a beautiful green land, there lived a young boy named David. David was a shepherd. His job was to take care of his father's sheep. Every day, he walked with them, watched them eat sweet grass, and kept them safe.\n\nDavid was not big. He was not strong. But David had something very special: **he trusted God with all his heart.**\n\n---\n\n## The Big Giant\n\nOne day, David went to visit his older brothers who were soldiers. There, he saw a giant named Goliath. Goliath was very, very tall. He wore heavy armor and had a huge spear. \n\nEvery morning and every evening, Goliath came out and yelled at the soldiers. He made them feel very scared. None of the soldiers wanted to fight him.\n\nBut David said, *"Do not be afraid! I will go and fight the giant."*\n\nThe king looked at David and said, *"You are just a boy, and he is a giant!"*\n\nDavid smiled and replied, *"God helped me save my sheep from lions and bears. He will help me now too!"*\n\n---\n\n## Five Smooth Stones\n\nInstead of heavy armor, David took his shepherd's staff. He went to a bubbling brook and chose **five smooth stones**. He put them in his pouch, took his sling, and walked toward the giant.\n\nWhen Goliath saw David, he laughed. *"Am I a dog that you come at me with sticks?"* he boomed.\n\nDavid stood tall. *"You come with a sword and spear, but I come to you in the name of the Lord!"*\n\n---\n\n## The Victory\n\nDavid reached into his bag, took out a stone, and put it in his sling. He swung it around and around, then let it fly!\n\n*Swoosh!* \n\nThe stone sailed through the air and hit Goliath right on his forehead. The giant stopped laughing. He wobbled, he shook, and then—\n\n*THUD!*\n\nThe giant fell flat on the ground. The battle was won, not by strength, but by trust in God!\n\n---\n\n### What We Learned:\n1. **No giant is too big** when God is on our side.\n2. **You are never too small** to do great things for God.\n3. **Trust God** always, just like David did!`,
        status: 'published',
        publish_date: new Date().toISOString()
      },
      {
        id: 'kids-3',
        zone: 'kids',
        type: 'writing',
        title: 'Writing Activity: A Note to Jesus',
        description: 'Type a special letter or thank-you note to Jesus. Share what you are thankful for today!',
        writing_prompt: 'Write a thank-you note to Jesus. Tell Him what you are thankful for today, or write a prayer!',
        thumbnail_url: 'https://picsum.photos/seed/writing/400/250',
        status: 'published',
        publish_date: new Date().toISOString()
      },
      {
        id: 'kids-4',
        zone: 'kids',
        type: 'painting',
        title: 'Coloring Activity: The Cross of Grace',
        description: 'Use our paint tools to color the cross outline! Draw, paint, and create your own artwork.',
        coloring_image_url: 'https://images.unsplash.com/photo-1601247076559-459b7325606d?w=400&q=80',
        thumbnail_url: 'https://picsum.photos/seed/cross/400/250',
        status: 'published',
        publish_date: new Date().toISOString()
      }
    ];
    localStorage.setItem('ft_mock_content_items', JSON.stringify(initialContent));
  }

  if (!localStorage.getItem('ft_mock_votd_overrides')) {
    localStorage.setItem('ft_mock_votd_overrides', JSON.stringify([]));
  }

  if (!localStorage.getItem('ft_mock_broadcast_status')) {
    const defaultBroadcast: DbBroadcastStatus = {
      is_live: false,
      title: 'Sunday Morning Glory Service',
      url: 'https://www.youtube.com/embed/qH5HIPl0hRo',
      hero_video_url: '/assets/faith-tribe-hero.mp4',
      hero_image_url: '/assets/faith-tribe-hero-poster-1080.jpg'
    };
    localStorage.setItem('ft_mock_broadcast_status', JSON.stringify(defaultBroadcast));
  }

  if (!localStorage.getItem('ft_mock_bible_versions')) {
    const defaultVersions: BibleVersion[] = [
      { bible_id: 3034, label: 'Berean Standard Bible (BSB)', short_code: 'BSB', display_order: 1, is_active: true, is_verified: true },
      { bible_id: 1932, label: 'Free Bible Version (FBV)', short_code: 'FBV', display_order: 2, is_active: true, is_verified: true },
      { bible_id: 1588, label: 'Amplified Bible (AMP)', short_code: 'AMP', display_order: 3, is_active: true, is_verified: true },
      { bible_id: 111, label: 'New International Version (NIV)', short_code: 'NIV', display_order: 4, is_active: true, is_verified: true },
      { bible_id: 12, label: 'American Standard Version (ASV)', short_code: 'ASV', display_order: 5, is_active: true, is_verified: true },
      { bible_id: 2079, label: 'EasyEnglish Bible', short_code: 'EEB', display_order: 6, is_active: true, is_verified: true },
      { bible_id: 911, label: 'Yoruba Contemporary Bible', short_code: 'YCB', display_order: 7, is_active: true, is_verified: true },
      { bible_id: 1624, label: 'Igbo Contemporary Bible', short_code: 'ICB', display_order: 8, is_active: true, is_verified: true },
      { bible_id: 1614, label: 'Hausa Contemporary Bible', short_code: 'HCB', display_order: 9, is_active: true, is_verified: true }
    ];
    localStorage.setItem('ft_mock_bible_versions', JSON.stringify(defaultVersions));
  }

  if (!localStorage.getItem('ft_mock_zone_defaults')) {
    const defaultDefaults = {
      kids: 2079,
      teens: 3034,
      teachers: 3034
    };
    localStorage.setItem('ft_mock_zone_defaults', JSON.stringify(defaultDefaults));
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isRealSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        }
      }
    }) 
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
      return null;
    } catch (e) {
      console.warn("Supabase custom verse fetch failed:", e);
      return null;
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
  tier?: 'basic' | 'advanced';
  review_status?: 'draft' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
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

// Simple hash utility for query text caching
function simpleQueryHash(query: string): string {
  const normalized = query.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export async function createEscalation(message: string): Promise<boolean> {
  if (isRealSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('escalations')
        .insert([{ message, status: 'queued' }]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Failed to create escalation record in database:", e);
    }
  }
  console.log("Local Escalation Created (Database offline):", message);
  return false;
}

export async function getChatbotCachedResponse(query: string, audience: string): Promise<string | null> {
  if (isRealSupabase && supabase) {
    try {
      const hash = simpleQueryHash(query);
      const { data, error } = await supabase
        .from('chatbot_cache')
        .select('response_text')
        .eq('query_hash', hash)
        .eq('audience', audience)
        .maybeSingle();
        
      if (error) throw error;
      return data ? data.response_text : null;
    } catch (e) {
      console.warn("Failed to check chatbot cache in database:", e);
    }
  }
  return null;
}

export async function setChatbotCachedResponse(query: string, audience: string, response: string): Promise<boolean> {
  if (isRealSupabase && supabase) {
    try {
      const hash = simpleQueryHash(query);
      const { error } = await supabase
        .from('chatbot_cache')
        .upsert({
          query_hash: hash,
          query_text: query,
          audience,
          response_text: response
        }, { onConflict: 'query_hash' });
        
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Failed to write to chatbot cache in database:", e);
    }
  }
  return false;
}

export async function signInStaff(email: string, password: string): Promise<StaffMember> {
  const cleanEmail = email.trim().toLowerCase();
  
  if (isRealSupabase && supabase) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentication failed');
    
    const { data: staffData, error: dbError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (dbError) {
      throw new Error(`Profile not found in staff registry: ${dbError.message}`);
    }
    
    if (staffData.status === 'invited') {
      const { data: updatedStaff, error: updateError } = await supabase
        .from('staff')
        .update({ status: 'active' })
        .eq('id', authData.user.id)
        .select()
        .single();
      if (updateError) throw updateError;
      
      await logAuditLocalOrDB(updatedStaff.id, 'staff.activated', 'staff', updatedStaff.id, { email: cleanEmail });
      return updatedStaff;
    }
    
    if (staffData.status === 'deactivated') {
      throw new Error('This account has been deactivated by an administrator.');
    }
    
    return staffData;
  } else {
    const mockStaffList: StaffMember[] = JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
    const staff = mockStaffList.find(s => s.email.toLowerCase() === cleanEmail);
    
    if (cleanEmail === 'admin@faithtribe.com' && password === 'password') {
      const adminUser = mockStaffList.find(s => s.id === 'mock-super-admin-id') || {
        id: 'mock-super-admin-id',
        email: 'admin@faithtribe.com',
        full_name: 'System Administrator',
        role: 'super_admin' as const,
        scoped_zone: null,
        status: 'active' as const,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('ft_admin_session', JSON.stringify(adminUser));
      return adminUser;
    }
    
    if (staff) {
      if (staff.status === 'deactivated') {
        throw new Error('This account has been deactivated by an administrator.');
      }
      if (password === 'password') {
        if (staff.status === 'invited') {
          staff.status = 'active';
          localStorage.setItem('ft_mock_staff', JSON.stringify(mockStaffList));
          await logAuditLocalOrDB(staff.id, 'staff.activated', 'staff', staff.id, { email: cleanEmail });
        }
        localStorage.setItem('ft_admin_session', JSON.stringify(staff));
        return staff;
      }
    }
    
    throw new Error('Incorrect email or password. Use password "password" for mock accounts.');
  }
}

export async function signOutStaff(): Promise<void> {
  if (isRealSupabase && supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('ft_admin_session');
}

export async function getCurrentStaff(): Promise<StaffMember | null> {
  if (isRealSupabase && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return null;
    
    const { data: staffData, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (error || !staffData) return null;
    return staffData;
  } else {
    const saved = localStorage.getItem('ft_admin_session');
    return saved ? JSON.parse(saved) : null;
  }
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    return JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
  }
}

export async function inviteStaffMember(email: string, fullName: string, role: StaffRole, scopedZone: ZoneScope): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const response = await fetch('/api/admin/staff/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, role, scopedZone })
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Failed to send staff invitation');
    }
  } else {
    const mockStaffList: StaffMember[] = JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
    const exists = mockStaffList.some(s => s.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) throw new Error('A staff member with this email already exists.');

    const newStaff: StaffMember = {
      id: `mock-staff-id-${Date.now()}`,
      email: email.trim().toLowerCase(),
      full_name: fullName,
      role,
      scoped_zone: role === 'zone_manager' ? scopedZone : null,
      status: 'invited',
      invited_by: actorId,
      created_at: new Date().toISOString()
    };

    mockStaffList.push(newStaff);
    localStorage.setItem('ft_mock_staff', JSON.stringify(mockStaffList));
    await logAuditLocalOrDB(actorId, 'staff.invited', 'staff', newStaff.id, { email, role });
  }
}

export async function updateStaffRole(id: string, role: StaffRole, scopedZone: ZoneScope): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { error } = await supabase
      .from('staff')
      .update({ role, scoped_zone: role === 'zone_manager' ? scopedZone : null })
      .eq('id', id);
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'staff.role_changed', 'staff', id, { role, scopedZone });
  } else {
    const mockStaffList: StaffMember[] = JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
    const index = mockStaffList.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff member not found');
    
    mockStaffList[index].role = role;
    mockStaffList[index].scoped_zone = role === 'zone_manager' ? scopedZone : null;
    localStorage.setItem('ft_mock_staff', JSON.stringify(mockStaffList));
    await logAuditLocalOrDB(actorId, 'staff.role_changed', 'staff', id, { role, scopedZone });
  }
}

export async function deactivateStaffMember(id: string): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { error } = await supabase
      .from('staff')
      .update({ status: 'deactivated', deactivated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'staff.deactivated', 'staff', id, {});
  } else {
    const mockStaffList: StaffMember[] = JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
    const index = mockStaffList.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff member not found');
    
    mockStaffList[index].status = 'deactivated';
    mockStaffList[index].deactivated_at = new Date().toISOString();
    localStorage.setItem('ft_mock_staff', JSON.stringify(mockStaffList));
    await logAuditLocalOrDB(actorId, 'staff.deactivated', 'staff', id, {});
  }
}

export async function reactivateStaffMember(id: string): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { error } = await supabase
      .from('staff')
      .update({ status: 'active', deactivated_at: null })
      .eq('id', id);
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'staff.reactivated', 'staff', id, {});
  } else {
    const mockStaffList: StaffMember[] = JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
    const index = mockStaffList.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff member not found');
    
    mockStaffList[index].status = 'active';
    mockStaffList[index].deactivated_at = null;
    localStorage.setItem('ft_mock_staff', JSON.stringify(mockStaffList));
    await logAuditLocalOrDB(actorId, 'staff.reactivated', 'staff', id, {});
  }
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*, staff!audit_log_actor_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((entry: any) => ({
      id: entry.id,
      actor_id: entry.actor_id,
      actor_name: entry.staff?.full_name || 'System',
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      details: entry.details,
      created_at: entry.created_at
    }));
  } else {
    const logs: AuditLogEntry[] = JSON.parse(localStorage.getItem('ft_mock_audit_log') || '[]');
    const staffList: StaffMember[] = JSON.parse(localStorage.getItem('ft_mock_staff') || '[]');
    return logs.map(l => ({
      ...l,
      actor_name: staffList.find(s => s.id === l.actor_id)?.full_name || 'System'
    })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

async function logAuditLocalOrDB(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: any
): Promise<void> {
  if (isRealSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          actor_id: actorId === 'unknown' ? null : actorId,
          action,
          target_type: targetType,
          target_id: targetId,
          details
        });
      if (error) console.error('Failed to log audit entry to DB:', error);
    } catch (e) {
      console.error('Failed to log audit entry:', e);
    }
    const logs: AuditLogEntry[] = JSON.parse(localStorage.getItem('ft_mock_audit_log') || '[]');
    const newLog: AuditLogEntry = {
      id: `mock-log-id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('ft_mock_audit_log', JSON.stringify(logs));
  }
}

export async function fetchContentItems(
  zone?: 'kids' | 'teens' | 'teachers',
  type?: 'video' | 'reading' | 'writing' | 'painting' | 'document',
  status?: 'draft' | 'scheduled' | 'published' | 'archived'
): Promise<DbContentItem[]> {
  if (isRealSupabase && supabase) {
    let query = supabase.from('content_items').select('*');
    if (zone) query = query.eq('zone', zone);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    let list: DbContentItem[] = JSON.parse(localStorage.getItem('ft_mock_content_items') || '[]');
    if (zone) list = list.filter(i => i.zone === zone);
    if (type) list = list.filter(i => i.type === type);
    if (status) list = list.filter(i => i.status === status);
    return list.sort((a, b) => {
      const orderA = a.display_order ?? 0;
      const orderB = b.display_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }
}

export async function upsertContentItem(item: Partial<DbContentItem>): Promise<DbContentItem> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const isNew = !item.id;
    const payload = {
      ...item,
      updated_at: new Date().toISOString(),
      ...(isNew ? { created_by: actorId, created_at: new Date().toISOString() } : {})
    };
    
    const { data, error } = await supabase
      .from('content_items')
      .upsert(payload)
      .select()
      .single();
      
    if (error) throw error;
    
    await logAuditLocalOrDB(
      actorId, 
      isNew ? 'content.created' : 'content.updated', 
      'content_items', 
      data.id, 
      { title: data.title, type: data.type, zone: data.zone }
    );
    return data;
  } else {
    let list: DbContentItem[] = JSON.parse(localStorage.getItem('ft_mock_content_items') || '[]');
    const isNew = !item.id;
    const finalItem: DbContentItem = {
      ...(item as DbContentItem),
      id: item.id || `content-id-${Date.now()}`,
      updated_at: new Date().toISOString(),
      ...(isNew ? { created_by: actorId, created_at: new Date().toISOString() } : {})
    };
    
    if (isNew) {
      list.push(finalItem);
    } else {
      const idx = list.findIndex(i => i.id === item.id);
      if (idx !== -1) list[idx] = finalItem;
      else list.push(finalItem);
    }
    
    localStorage.setItem('ft_mock_content_items', JSON.stringify(list));
    await logAuditLocalOrDB(
      actorId, 
      isNew ? 'content.created' : 'content.updated', 
      'content_items', 
      finalItem.id, 
      { title: finalItem.title, type: finalItem.type, zone: finalItem.zone }
    );
    return finalItem;
  }
}

export async function deleteContentItem(id: string): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { error } = await supabase.from('content_items').delete().eq('id', id);
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'content.deleted', 'content_items', id, {});
  } else {
    let list: DbContentItem[] = JSON.parse(localStorage.getItem('ft_mock_content_items') || '[]');
    list = list.filter(i => i.id !== id);
    localStorage.setItem('ft_mock_content_items', JSON.stringify(list));
    await logAuditLocalOrDB(actorId, 'content.deleted', 'content_items', id, {});
  }
}

export async function fetchVotdOverrides(zone?: 'kids' | 'teens' | 'teachers'): Promise<VotdOverride[]> {
  if (isRealSupabase && supabase) {
    let query = supabase.from('votd_overrides').select('*');
    if (zone) query = query.eq('zone', zone);
    const { data, error } = await query.order('override_date', { ascending: true });
    if (error) throw error;
    return data || [];
  } else {
    let list: VotdOverride[] = JSON.parse(localStorage.getItem('ft_mock_votd_overrides') || '[]');
    if (zone) list = list.filter(o => o.zone === zone);
    return list.sort((a, b) => a.override_date.localeCompare(b.override_date));
  }
}

export async function setVotdOverride(
  zone: 'kids' | 'teens' | 'teachers',
  date: string,
  reference: string,
  versionId: number,
  note?: string | null
): Promise<VotdOverride> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('votd_overrides')
      .upsert({
        zone,
        override_date: date,
        reference,
        version_id: versionId,
        note,
        created_by: actorId
      }, { onConflict: 'zone,override_date' })
      .select()
      .single();
      
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'votd.override_set', 'votd_overrides', data.id, { zone, date, reference });
    return data;
  } else {
    const list: VotdOverride[] = JSON.parse(localStorage.getItem('ft_mock_votd_overrides') || '[]');
    const existingIdx = list.findIndex(o => o.zone === zone && o.override_date === date);
    
    const item: VotdOverride = {
      id: existingIdx !== -1 ? list[existingIdx].id : `votd-override-${Date.now()}`,
      zone,
      override_date: date,
      reference,
      version_id: versionId,
      note,
      created_by: actorId
    };
    
    if (existingIdx !== -1) {
      list[existingIdx] = item;
    } else {
      list.push(item);
    }
    
    localStorage.setItem('ft_mock_votd_overrides', JSON.stringify(list));
    await logAuditLocalOrDB(actorId, 'votd.override_set', 'votd_overrides', item.id, { zone, date, reference });
    return item;
  }
}

export async function deleteVotdOverride(id: string): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { error } = await supabase.from('votd_overrides').delete().eq('id', id);
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'votd.override_deleted', 'votd_overrides', id, {});
  } else {
    let list: VotdOverride[] = JSON.parse(localStorage.getItem('ft_mock_votd_overrides') || '[]');
    list = list.filter(o => o.id !== id);
    localStorage.setItem('ft_mock_votd_overrides', JSON.stringify(list));
    await logAuditLocalOrDB(actorId, 'votd.override_deleted', 'votd_overrides', id, {});
  }
}

export async function fetchActiveBibleVersions(): Promise<BibleVersion[]> {
  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('bible_versions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } else {
    const list: BibleVersion[] = JSON.parse(localStorage.getItem('ft_mock_bible_versions') || '[]');
    return list.filter(v => v.is_active).sort((a, b) => a.display_order - b.display_order);
  }
}

export async function fetchBibleVersionsAdmin(): Promise<BibleVersion[]> {
  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('bible_versions')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } else {
    const list: BibleVersion[] = JSON.parse(localStorage.getItem('ft_mock_bible_versions') || '[]');
    return list.sort((a, b) => a.display_order - b.display_order);
  }
}

export async function upsertBibleVersion(version: Partial<BibleVersion>): Promise<BibleVersion> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('bible_versions')
      .upsert(version)
      .select()
      .single();
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'bible.version_upserted', 'bible_versions', String(data.bible_id), { label: data.label });
    return data;
  } else {
    const list: BibleVersion[] = JSON.parse(localStorage.getItem('ft_mock_bible_versions') || '[]');
    const idx = list.findIndex(v => v.bible_id === version.bible_id);
    
    const finalItem: BibleVersion = {
      ...(idx !== -1 ? list[idx] : {}),
      ...(version as BibleVersion),
      display_order: version.display_order ?? (idx !== -1 ? list[idx].display_order : list.length + 1)
    };
    
    if (idx !== -1) list[idx] = finalItem;
    else list.push(finalItem);
    
    localStorage.setItem('ft_mock_bible_versions', JSON.stringify(list));
    await logAuditLocalOrDB(actorId, 'bible.version_upserted', 'bible_versions', String(finalItem.bible_id), { label: finalItem.label });
    return finalItem;
  }
}

export async function verifyBibleVersion(bibleId: number): Promise<boolean> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    
    const response = await fetch('/api/admin/bible-versions/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bibleId })
    });
    
    const result = await response.json();
    if (response.ok && result.verified) {
      await logAuditLocalOrDB(actorId, 'bible.version_verified', 'bible_versions', String(bibleId), { verified: true });
      return true;
    }
    await logAuditLocalOrDB(actorId, 'bible.version_verification_failed', 'bible_versions', String(bibleId), { verified: false });
    return false;
  } else {
    const list: BibleVersion[] = JSON.parse(localStorage.getItem('ft_mock_bible_versions') || '[]');
    const idx = list.findIndex(v => v.bible_id === bibleId);
    
    if (idx !== -1) {
      list[idx].is_verified = true;
      list[idx].last_verified_at = new Date().toISOString();
      localStorage.setItem('ft_mock_bible_versions', JSON.stringify(list));
    }
    
    await logAuditLocalOrDB(actorId, 'bible.version_verified', 'bible_versions', String(bibleId), { verified: true, mock: true });
    return true;
  }
}

export async function fetchZoneDefaultVersions(): Promise<Record<string, number>> {
  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('zone_default_versions')
      .select('*');
    if (error) throw error;
    
    const map: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      map[row.zone] = row.bible_id;
    });
    return map;
  } else {
    return JSON.parse(localStorage.getItem('ft_mock_zone_defaults') || '{}');
  }
}

export async function setZoneDefaultVersion(zone: 'kids' | 'teens' | 'teachers', bibleId: number): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const { error } = await supabase
      .from('zone_default_versions')
      .upsert({ zone, bible_id: bibleId }, { onConflict: 'zone' });
    if (error) throw error;
    await logAuditLocalOrDB(actorId, 'bible.default_version_changed', 'zone_default_versions', zone, { bibleId });
  } else {
    const map = JSON.parse(localStorage.getItem('ft_mock_zone_defaults') || '{}');
    map[zone] = bibleId;
    localStorage.setItem('ft_mock_zone_defaults', JSON.stringify(map));
    await logAuditLocalOrDB(actorId, 'bible.default_version_changed', 'zone_default_versions', zone, { bibleId });
  }
}

export async function fetchBroadcastStatus(): Promise<DbBroadcastStatus> {
  if (isRealSupabase && supabase) {
    const { data, error } = await supabase
      .from('broadcast_status')
      .select('*')
      .order('id', { ascending: true })
      .limit(1);
      
    if (error) throw error;
    if (data && data.length > 0) return data[0];
    
    return {
      is_live: false,
      title: 'Sunday Morning Glory Service',
      url: 'https://www.youtube.com/embed/qH5HIPl0hRo',
      hero_video_url: '/faith-tribe-hero.mp4',
      hero_image_url: '/faith-tribe-hero-poster-1080.jpg',
      teens_topic_title: 'Identity in a Filtered World',
      teens_topic_desc: 'Who are you when the screen is turned off? Learn how Christ defines your worth, potential, and future far beyond likes and comments.',
      teens_topic_video_id: 'dQw4w9WgXcQ'
    };
  } else {
    return JSON.parse(localStorage.getItem('ft_mock_broadcast_status') || '{}');
  }
}

export async function updateBroadcastStatus(
  isLive: boolean,
  title: string,
  url: string,
  heroVideoUrl: string,
  heroImageUrl: string,
  teensTopicTitle?: string,
  teensTopicDesc?: string,
  teensTopicVideoId?: string
): Promise<void> {
  const currentStaff = await getCurrentStaff();
  const actorId = currentStaff?.id || 'unknown';

  if (isRealSupabase && supabase) {
    const payload = {
      is_live: isLive,
      title,
      url,
      hero_video_url: heroVideoUrl,
      hero_image_url: heroImageUrl,
      teens_topic_title: teensTopicTitle || null,
      teens_topic_desc: teensTopicDesc || null,
      teens_topic_video_id: teensTopicVideoId || null,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    
    const { data, error: selectError } = await supabase.from('broadcast_status').select('id').limit(1);
    if (selectError) throw selectError;
    
    if (data && data.length > 0) {
      const { error } = await supabase
        .from('broadcast_status')
        .update(payload)
        .eq('id', data[0].id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('broadcast_status')
        .insert(payload);
      if (error) throw error;
    }
    
    await logAuditLocalOrDB(actorId, 'broadcast.updated', 'broadcast_status', '1', { isLive, title });
  } else {
    const payload: DbBroadcastStatus = {
      is_live: isLive,
      title,
      url,
      hero_video_url: heroVideoUrl,
      hero_image_url: heroImageUrl,
      teens_topic_title: teensTopicTitle || null,
      teens_topic_desc: teensTopicDesc || null,
      teens_topic_video_id: teensTopicVideoId || null,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('ft_mock_broadcast_status', JSON.stringify(payload));
    await logAuditLocalOrDB(actorId, 'broadcast.updated', 'broadcast_status', '1', { isLive, title });
  }
}

// ------------------------------------------------------------------------------------------------
// Analytics
// ------------------------------------------------------------------------------------------------

export async function logAnalyticsEvent(
  eventType: 'verse_reaction' | 'content_viewed' | 'chat_message_sent' | 'bible_version_selected',
  zone: string | null,
  metadata?: any
) {
  if (!isRealSupabase || !supabase) return;

  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        zone: zone,
        metadata: metadata || {}
      });

    if (error) {
      console.warn("Analytics logging failed:", error.message);
    }
  } catch (e) {
    console.warn("Analytics logging failed:", e);
  }
}

// ------------------------------------------------------------------------------------------------
// Audio Bible Filesets & Cache
// ------------------------------------------------------------------------------------------------

import { AudioFileset } from '../types';

export async function fetchAudioFilesets(): Promise<AudioFileset[]> {
  if (isRealSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('audio_filesets')
        .select('*')
        .order('id', { ascending: true });
      if (!error && data) return data;
    } catch (e) {
      console.warn("Error fetching audio filesets from DB, falling back to local:", e);
    }
  }
  return JSON.parse(localStorage.getItem('ft_mock_audio_filesets') || '[]');
}

export async function saveAudioFilesets(filesets: AudioFileset[]): Promise<void> {
  if (isRealSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('audio_filesets')
        .upsert(filesets, { onConflict: 'fileset_id' });
      if (!error) return;
    } catch (e) {
      console.warn("Error saving audio filesets to DB, falling back to local:", e);
    }
  }
  
  const current = JSON.parse(localStorage.getItem('ft_mock_audio_filesets') || '[]');
  const merged = [...current];
  for (const item of filesets) {
    const idx = merged.findIndex(x => x.fileset_id === item.fileset_id);
    if (idx >= 0) {
      merged[idx] = item;
    } else {
      merged.push(item);
    }
  }
  localStorage.setItem('ft_mock_audio_filesets', JSON.stringify(merged));
}

export async function fetchAudioCache(
  filesetId: string,
  book: string,
  chapter: number
): Promise<{ audioUrl: string; timestamps: any; copyrightText: string | null } | null> {
  if (isRealSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('audio_chapter_cache')
        .select('*')
        .eq('fileset_id', filesetId)
        .eq('book', book.toUpperCase())
        .eq('chapter', chapter)
        .single();
      if (!error && data) {
        return {
          audioUrl: data.audio_url,
          timestamps: data.timestamps,
          copyrightText: data.copyright_text
        };
      }
    } catch (e) {
      console.warn("Error fetching audio cache from DB, falling back to local:", e);
    }
  }
  
  const cacheKey = `ft_audio_cache_${filesetId}_${book.toUpperCase()}_${chapter}`;
  const local = localStorage.getItem(cacheKey);
  if (local) {
    return JSON.parse(local);
  }
  return null;
}

export async function saveAudioCache(
  filesetId: string,
  book: string,
  chapter: number,
  audioUrl: string,
  timestamps: any,
  copyrightText: string | null
): Promise<void> {
  if (isRealSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('audio_chapter_cache')
        .upsert({
          fileset_id: filesetId,
          book: book.toUpperCase(),
          chapter: chapter,
          audio_url: audioUrl,
          timestamps: timestamps || null,
          copyright_text: copyrightText,
          cached_at: new Date().toISOString()
        }, { onConflict: 'fileset_id,book,chapter' });
      if (!error) return;
    } catch (e) {
      console.warn("Error saving audio cache to DB, falling back to local:", e);
    }
  }
  
  const cacheKey = `ft_audio_cache_${filesetId}_${book.toUpperCase()}_${chapter}`;
  localStorage.setItem(cacheKey, JSON.stringify({
    audioUrl,
    timestamps,
    copyrightText
  }));
}



