import { createClient } from '@supabase/supabase-js';
import { StaffMember, AuditLogEntry, StaffRole, ZoneScope } from '../types';

// Initialize mock staff data in localStorage if empty for local dev fallbacks
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
}

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
  } else {
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


