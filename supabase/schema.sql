-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Role Enum
create type user_role as enum ('kid', 'teen', 'teacher', 'admin');

-- Content Type Enum
create type content_type as enum ('video', 'lesson', 'art', 'devotional');

-- Parishes Table
create table public.parishes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role user_role default 'teen',
  username text unique,
  full_name text,
  parish_id uuid references public.parishes(id),
  avatar_url text,
  badges jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Content Table ("The Vault" & Co-Creation)
create table public.content (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  url text not null, -- Image/Video URL
  type content_type not null,
  emotion_tag text, -- For Kids "I feel..."
  author_id uuid references public.profiles(id),
  is_approved boolean default false, -- Moderation flag
  approved_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Streaks Table (Gamification)
create table public.streaks (
  user_id uuid references public.profiles(id) primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_login timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies (Row Level Security)
alter table public.profiles enable row level security;
alter table public.parishes enable row level security;
alter table public.content enable row level security;
alter table public.streaks enable row level security;

-- Policies (Simplified for Initial Setup)
-- Profiles: Everyone can read basic info, Users can update their own
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Content: Approved content is public. Unapproved is visible to Author & Teachers.
create policy "Approved content is public" on content for select using (is_approved = true);
create policy "Authors can see their own unapproved content" on content for select using (auth.uid() = author_id);
create policy "Teachers can see all content" on content for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
);
create policy "Users can upload content" on content for insert with check (auth.uid() = author_id);

-- Streaks: Users connect view/update their own
create policy "Users can view own streak" on streaks for select using (auth.uid() = user_id);
create policy "Users can update own streak" on streaks for update using (auth.uid() = user_id);

-- Insert Dummy Parishes
insert into public.parishes (name, location) values 
('Faith Tabernacle', 'Lagos'),
('Grace Chapel', 'Online'),
('Hope Center', 'Abuja');
