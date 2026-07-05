export enum Audience {
  HOME = 'HOME',
  ABOUT = 'ABOUT',
  KIDS = 'KIDS',
  TEENS = 'TEENS',
  TEACHERS = 'TEACHERS',
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
  type: 'VIDEO' | 'ARTICLE' | 'ACTIVITY' | 'LESSON_PLAN';
  duration?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}
