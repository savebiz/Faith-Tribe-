export enum Audience {
  HOME = 'HOME',
  ABOUT = 'ABOUT',
  KIDS = 'KIDS',
  KIDS_LIBRARY = 'KIDS_LIBRARY',
  TEENS = 'TEENS',
  TEENS_LIBRARY = 'TEENS_LIBRARY',
  TEACHERS = 'TEACHERS',
  TEACHERS_LIBRARY = 'TEACHERS_LIBRARY',
  BIBLE = 'BIBLE',
  ADMIN = 'ADMIN'
}

export type StaffRole = 'super_admin' | 'content_editor' | 'zone_manager' | 'teacher_volunteer' | 'reviewer';
export type ZoneScope = 'kids' | 'teens' | 'teachers' | null;

export interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  scoped_zone: ZoneScope;
  telegram_chat_id?: number | null;
  status: 'invited' | 'active' | 'deactivated';
  invited_by?: string | null;
  created_at: string;
  deactivated_at?: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  details?: any;
  created_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'VIDEO' | 'ARTICLE' | 'ACTIVITY' | 'LESSON_PLAN' | 'AUDIO' | 'DOCUMENT';
  duration?: string;
  youtubeVideoId?: string;
  articleContent?: string;
  readTime?: string;
  videoSource?: string;
  documentUrl?: string;
}

export interface DbContentItem {
  id: string;
  zone: 'kids' | 'teens' | 'teachers';
  type: 'video' | 'reading' | 'writing' | 'painting' | 'document' | 'audio';
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_source?: string | null;
  video_id?: string | null;
  duration?: string | null;
  story_content?: string | null;
  writing_prompt?: string | null;
  coloring_image_url?: string | null;
  document_url?: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publish_date?: string | null;
  unpublish_date?: string | null;
  created_by?: string | null;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface VotdOverride {
  id: string;
  zone: 'kids' | 'teens' | 'teachers';
  override_date: string; // YYYY-MM-DD
  reference: string;
  version_id: number;
  note?: string | null;
  created_by?: string | null;
}

export interface BibleVersion {
  id?: number;
  bible_id: number;
  label: string;
  short_code: string;
  display_order: number;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at?: string | null;
  created_at?: string;
}

export interface DbBroadcastStatus {
  id?: number;
  is_live: boolean;
  title?: string | null;
  url?: string | null;
  hero_video_url?: string | null;
  hero_image_url?: string | null;
  teens_topic_title?: string | null;
  teens_topic_desc?: string | null;
  teens_topic_video_id?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface Escalation {
  id: string;
  message: string;
  status: 'queued' | 'claimed' | 'resolved';
  claimed_by?: string | null;
  created_at: string;
}

export type AnalyticsEventType = 'verse_reaction' | 'content_viewed' | 'chat_message_sent' | 'bible_version_selected';

export interface AnalyticsEvent {
  id?: string;
  event_type: AnalyticsEventType;
  zone: string | null;
  metadata?: any;
  created_at?: string;
}

export interface AudioFileset {
  id?: number;
  fileset_id: string;
  language_code: string;  // 'eng', 'yor', 'ibo', 'hau'
  language_name: string;  // 'English', 'Yoruba', 'Igbo', 'Hausa'
  bible_name: string;
  media_type: string;     // 'DA' or 'SA'
  is_verified: boolean;
  discovered_at?: string;
}

export interface AudioChapterInfo {
  audioUrl: string;
  timestamps: any[] | null;
  copyrightText: string | null;
}

