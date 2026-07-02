export enum Audience {
  HOME = 'HOME',
  ABOUT = 'ABOUT',
  KIDS = 'KIDS',
  TEENS = 'TEENS',
  TEACHERS = 'TEACHERS',
  BIBLE = 'BIBLE'
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
