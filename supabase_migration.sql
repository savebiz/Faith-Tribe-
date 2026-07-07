-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access" ON site_settings;
CREATE POLICY "Allow anonymous read access"
  ON site_settings FOR SELECT
  USING (true);

-- Allow authenticated/service role writes
DROP POLICY IF EXISTS "Allow anonymous upsert access for settings" ON site_settings;
CREATE POLICY "Allow anonymous upsert access for settings"
  ON site_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create bible_study_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS bible_study_notes (
  ref TEXT PRIMARY KEY,
  usfm_start TEXT,
  usfm_end TEXT,
  title TEXT,
  content_html TEXT,
  acai JSONB,
  related_resources JSONB,
  review_level TEXT,
  language TEXT,
  source_version TEXT,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on usfm_start for rapid lookups
CREATE INDEX IF NOT EXISTS idx_study_notes_usfm ON bible_study_notes (usfm_start);

-- Enable RLS
ALTER TABLE bible_study_notes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
DROP POLICY IF EXISTS "Allow anonymous read access for study notes" ON bible_study_notes;
CREATE POLICY "Allow anonymous read access for study notes"
  ON bible_study_notes FOR SELECT
  USING (true);

-- Allow anonymous upsert access for ingestion
DROP POLICY IF EXISTS "Allow anonymous upsert access for study notes" ON bible_study_notes;
CREATE POLICY "Allow anonymous upsert access for study notes"
  ON bible_study_notes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Phase 1: Admin Roles & Staff Portal DDL Migration

-- Safe enum creation checks
DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM (
    'super_admin',
    'content_editor',
    'zone_manager',
    'teacher_volunteer',
    'reviewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE zone_scope AS ENUM (
    'kids',
    'teens',
    'teachers'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create staff table referencing auth.users
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role staff_role NOT NULL DEFAULT 'teacher_volunteer',
  scoped_zone zone_scope,
  telegram_chat_id BIGINT,
  status TEXT NOT NULL DEFAULT 'invited', -- 'invited' | 'active' | 'deactivated'
  invited_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES staff(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION current_staff_role() RETURNS staff_role AS $$
  SELECT role FROM staff WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION current_staff_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_staff_role() TO authenticated;

CREATE OR REPLACE FUNCTION current_staff_zone() RETURNS zone_scope AS $$
  SELECT scoped_zone FROM staff WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION current_staff_zone() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_staff_zone() TO authenticated;

-- Policies definition
DROP POLICY IF EXISTS "super_admin manages staff" ON staff;
CREATE POLICY "super_admin manages staff"
  ON staff FOR ALL
  USING (current_staff_role() = 'super_admin');

DROP POLICY IF EXISTS "staff reads own record" ON staff;
CREATE POLICY "staff reads own record"
  ON staff FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "super_admin reads audit log" ON audit_log;
CREATE POLICY "super_admin reads audit log"
  ON audit_log FOR SELECT
  USING (current_staff_role() = 'super_admin');

DROP POLICY IF EXISTS "any authenticated staff can write audit entries" ON audit_log;
CREATE POLICY "any authenticated staff can write audit entries"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() is not null);

-- Phase 2 & 3: Content, VOTD Overrides, Live stream, and Bible versions

-- Safe enum creation checks
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('video', 'reading', 'writing', 'painting', 'document');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE zone_name AS ENUM ('kids', 'teens', 'teachers');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone zone_name NOT NULL,
  type content_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_source TEXT,
  video_id TEXT,
  duration TEXT,
  story_content TEXT,
  writing_prompt TEXT,
  coloring_image_url TEXT,
  document_url TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  publish_date TIMESTAMPTZ,
  unpublish_date TIMESTAMPTZ,
  created_by UUID REFERENCES staff(id),
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create votd_overrides table
CREATE TABLE IF NOT EXISTS votd_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone zone_name NOT NULL,
  override_date DATE NOT NULL,
  reference TEXT NOT NULL,
  version_id INTEGER NOT NULL,
  note TEXT,
  created_by UUID REFERENCES staff(id),
  UNIQUE (zone, override_date)
);

-- Create broadcast_status table safely or modify it
DO $$ BEGIN
  ALTER TABLE broadcast_status ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES staff(id);
  ALTER TABLE broadcast_status ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
  WHEN undefined_table THEN
    CREATE TABLE IF NOT EXISTS broadcast_status (
      id SERIAL PRIMARY KEY,
      is_live BOOLEAN NOT NULL DEFAULT false,
      title TEXT,
      url TEXT,
      hero_video_url TEXT,
      hero_image_url TEXT,
      updated_by UUID REFERENCES staff(id),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
END $$;

-- Create bible_versions table
CREATE TABLE IF NOT EXISTS bible_versions (
  id SERIAL PRIMARY KEY,
  bible_id INTEGER NOT NULL UNIQUE,
  label TEXT NOT NULL,
  short_code TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create zone_default_versions table
CREATE TABLE IF NOT EXISTS zone_default_versions (
  zone zone_name PRIMARY KEY,
  bible_id INTEGER REFERENCES bible_versions(bible_id)
);

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votd_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_default_versions ENABLE ROW LEVEL SECURITY;

-- content_items policies
DROP POLICY IF EXISTS "public reads published content" ON content_items;
CREATE POLICY "public reads published content"
  ON content_items FOR SELECT
  USING (
    status = 'published'
    AND (publish_date IS NULL OR publish_date <= now())
    AND (unpublish_date IS NULL OR unpublish_date > now())
  );

DROP POLICY IF EXISTS "content editors manage all zones" ON content_items;
CREATE POLICY "content editors manage all zones"
  ON content_items FOR ALL
  USING (current_staff_role() IN ('super_admin', 'content_editor'));

DROP POLICY IF EXISTS "zone managers manage their own zone only" ON content_items;
CREATE POLICY "zone managers manage their own zone only"
  ON content_items FOR ALL
  USING (
    current_staff_role() = 'zone_manager'
    AND zone::text = current_staff_zone()::text
  );

-- votd_overrides policies
DROP POLICY IF EXISTS "public reads overrides" ON votd_overrides;
CREATE POLICY "public reads overrides"
  ON votd_overrides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "content staff manage overrides" ON votd_overrides;
CREATE POLICY "content staff manage overrides"
  ON votd_overrides FOR ALL
  USING (
    current_staff_role() IN ('super_admin', 'content_editor')
    OR (current_staff_role() = 'zone_manager' AND zone::text = current_staff_zone()::text)
  );

-- broadcast_status policies
DROP POLICY IF EXISTS "public reads broadcast status" ON broadcast_status;
CREATE POLICY "public reads broadcast status"
  ON broadcast_status FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "content staff manage broadcast status" ON broadcast_status;
CREATE POLICY "content staff manage broadcast status"
  ON broadcast_status FOR ALL
  USING (current_staff_role() IN ('super_admin', 'content_editor'));

-- bible_versions policies
DROP POLICY IF EXISTS "public reads active versions" ON bible_versions;
CREATE POLICY "public reads active versions"
  ON bible_versions FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "content staff manage versions" ON bible_versions;
CREATE POLICY "content staff manage versions"
  ON bible_versions FOR ALL
  USING (current_staff_role() IN ('super_admin', 'content_editor'));

-- zone_default_versions policies
DROP POLICY IF EXISTS "public reads zone defaults" ON zone_default_versions;
CREATE POLICY "public reads zone defaults"
  ON zone_default_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "content staff manage zone defaults" ON zone_default_versions;
CREATE POLICY "content staff manage zone defaults"
  ON zone_default_versions FOR ALL
  USING (current_staff_role() IN ('super_admin', 'content_editor'));

-- Seed default Bible Versions
INSERT INTO bible_versions (bible_id, label, short_code, display_order, is_active, is_verified, last_verified_at)
VALUES 
  (3034, 'Berean Standard Bible (BSB)', 'BSB', 1, true, true, now()),
  (1932, 'Free Bible Version (FBV)', 'FBV', 2, true, true, now()),
  (1588, 'Amplified Bible (AMP)', 'AMP', 3, true, true, now()),
  (111, 'New International Version (NIV)', 'NIV', 4, true, true, now()),
  (12, 'American Standard Version (ASV)', 'ASV', 5, true, true, now()),
  (2079, 'EasyEnglish Bible', 'EEB', 6, true, true, now()),
  (911, 'Yoruba Contemporary Bible', 'YCB', 7, true, true, now()),
  (1624, 'Igbo Contemporary Bible', 'ICB', 8, true, true, now()),
  (1614, 'Hausa Contemporary Bible', 'HCB', 9, true, true, now())
ON CONFLICT (bible_id) DO UPDATE 
SET 
  label = EXCLUDED.label, 
  short_code = EXCLUDED.short_code, 
  display_order = EXCLUDED.display_order;

-- Seed default Zone Defaults
INSERT INTO zone_default_versions (zone, bible_id)
VALUES
  ('kids', 2079),
  ('teens', 3034),
  ('teachers', 3034)
ON CONFLICT (zone) DO UPDATE
SET bible_id = EXCLUDED.bible_id;

-- ----------------------------------------------------
-- Storage Bucket for Content Media
-- ----------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-media', 'content-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "staff can upload content media" ON storage.objects;
CREATE POLICY "staff can upload content media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'content-media' AND current_staff_role() IS NOT NULL);

DROP POLICY IF EXISTS "public can view content media" ON storage.objects;
CREATE POLICY "public can view content media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'content-media');

-- ----------------------------------------------------
-- Phase 4: Safety & Moderation
-- ----------------------------------------------------

-- Add Review fields to bible_study_notes
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS tier text DEFAULT 'basic';
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'draft';
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES staff(id);
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Update RLS for bible_study_notes
DROP POLICY IF EXISTS "Allow anonymous read access for study notes" ON bible_study_notes;
DROP POLICY IF EXISTS "public reads approved content" ON bible_study_notes;
CREATE POLICY "public reads approved content"
  ON bible_study_notes FOR SELECT
  USING (tier = 'advanced' OR review_status = 'approved');

DROP POLICY IF EXISTS "reviewers manage basic tier drafts" ON bible_study_notes;
CREATE POLICY "reviewers manage basic tier drafts"
  ON bible_study_notes FOR ALL
  USING (current_staff_role() IN ('super_admin', 'reviewer'));

-- Create escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  status text DEFAULT 'queued',
  claimed_by uuid REFERENCES staff(id),
  created_at timestamptz DEFAULT now()
);

-- Escalations RLS
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers and admins read escalations" ON escalations;
CREATE POLICY "teachers and admins read escalations"
  ON escalations FOR SELECT
  USING (current_staff_role() IN ('super_admin', 'teacher_volunteer'));

DROP POLICY IF EXISTS "claim owner or admin can update" ON escalations;
CREATE POLICY "claim owner or admin can update"
  ON escalations FOR UPDATE
  USING (
    current_staff_role() = 'super_admin'
    OR claimed_by = auth.uid()
  );

DROP POLICY IF EXISTS "anyone can insert escalations" ON escalations;
CREATE POLICY "anyone can insert escalations"
  ON escalations FOR INSERT WITH CHECK (id IS NOT NULL);


-- ----------------------------------------------------
-- Phase 5: Analytics Dashboard
-- ----------------------------------------------------

-- Create analytics ENUM if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type') THEN
        CREATE TYPE analytics_event_type AS ENUM (
          'verse_reaction',
          'content_viewed',
          'chat_message_sent',
          'bible_version_selected'
        );
    END IF;
END
$$;

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type analytics_event_type NOT NULL,
  zone text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Analytics RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "any request can insert events" ON analytics_events;
CREATE POLICY "any request can insert events"
  ON analytics_events FOR INSERT WITH CHECK (id IS NOT NULL);

DROP POLICY IF EXISTS "content staff read analytics" ON analytics_events;
CREATE POLICY "content staff read analytics"
  ON analytics_events FOR SELECT
  USING (current_staff_role() IN ('super_admin', 'content_editor', 'zone_manager'));

-- Create chatbot_cache table
CREATE TABLE IF NOT EXISTS chatbot_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text UNIQUE NOT NULL,
  query_text text NOT NULL,
  audience text NOT NULL,
  response_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS for chatbot_cache
ALTER TABLE chatbot_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anyone read chatbot_cache" ON chatbot_cache;
CREATE POLICY "allow anyone read chatbot_cache" ON chatbot_cache FOR SELECT USING (id IS NOT NULL);

DROP POLICY IF EXISTS "allow anyone insert chatbot_cache" ON chatbot_cache;
CREATE POLICY "allow anyone insert chatbot_cache" ON chatbot_cache FOR INSERT WITH CHECK (id IS NOT NULL);

-- Topic of the Month Columns
ALTER TABLE broadcast_status ADD COLUMN IF NOT EXISTS teens_topic_title TEXT DEFAULT 'Identity in a Filtered World';
ALTER TABLE broadcast_status ADD COLUMN IF NOT EXISTS teens_topic_desc TEXT DEFAULT 'Who are you when the screen is turned off? Learn how Christ defines your worth, potential, and future far beyond likes and comments.';
ALTER TABLE broadcast_status ADD COLUMN IF NOT EXISTS teens_topic_video_id TEXT DEFAULT 'dQw4w9WgXcQ';

-- Add audio value to content_type enum
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'audio';

-- ----------------------------------------------------
-- Audio Bible Filesets & Cache
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS audio_filesets (
  id serial PRIMARY KEY,
  fileset_id text NOT NULL UNIQUE,
  language_code text NOT NULL,  -- 'eng', 'yor', 'ibo', 'hau'
  language_name text NOT NULL,  -- 'English', 'Yoruba', 'Igbo', 'Hausa'
  bible_name text NOT NULL,
  media_type text NOT NULL,     -- 'DA' or 'SA'
  is_verified boolean DEFAULT false,
  discovered_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_chapter_cache (
  id serial PRIMARY KEY,
  fileset_id text NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  audio_url text NOT NULL,       -- streaming URL only
  timestamps jsonb,             -- verse timings
  copyright_text text,          -- copyright metadata
  cached_at timestamptz DEFAULT now(),
  UNIQUE (fileset_id, book, chapter)
);

-- RLS for audio_filesets
ALTER TABLE audio_filesets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow public read audio_filesets" ON audio_filesets;
CREATE POLICY "allow public read audio_filesets" ON audio_filesets FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow anyone manage audio_filesets" ON audio_filesets;
CREATE POLICY "allow anyone manage audio_filesets" ON audio_filesets FOR ALL USING (true) WITH CHECK (true);

-- RLS for audio_chapter_cache
ALTER TABLE audio_chapter_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow public read audio_chapter_cache" ON audio_chapter_cache;
CREATE POLICY "allow public read audio_chapter_cache" ON audio_chapter_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow anyone manage audio_chapter_cache" ON audio_chapter_cache;
CREATE POLICY "allow anyone manage audio_chapter_cache" ON audio_chapter_cache FOR ALL USING (true) WITH CHECK (true);


-- ----------------------------------------------------
-- Teachers Hub: Converts & Follow-up Tracking
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS converts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer,
  class_notes text,
  registered_by uuid REFERENCES staff(id) ON DELETE SET NULL,
  registered_at timestamptz DEFAULT now(),
  follow_up_status text DEFAULT 'pending' -- 'pending' | 'contacted' | 'completed'
);

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convert_id uuid REFERENCES converts(id) ON DELETE CASCADE,
  task_description text NOT NULL,
  due_at timestamptz, -- e.g. registered_at + 24 hours
  completed boolean DEFAULT false,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS class_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  goal_title text NOT NULL,      -- e.g. "Evangelism Focus"
  goal_description text,
  target_count integer NOT NULL, -- e.g. 5
  current_count integer DEFAULT 0,
  status text DEFAULT 'active',  -- 'active' | 'completed' | 'archived'
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE converts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for converts
DROP POLICY IF EXISTS "allow public read converts" ON converts;
CREATE POLICY "allow public read converts" ON converts FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow anyone insert converts" ON converts;
CREATE POLICY "allow anyone insert converts" ON converts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow anyone update converts" ON converts;
CREATE POLICY "allow anyone update converts" ON converts FOR UPDATE USING (true);

-- RLS Policies for follow_up_tasks
DROP POLICY IF EXISTS "allow public read follow_up_tasks" ON follow_up_tasks;
CREATE POLICY "allow public read follow_up_tasks" ON follow_up_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow anyone manage follow_up_tasks" ON follow_up_tasks;
CREATE POLICY "allow anyone manage follow_up_tasks" ON follow_up_tasks FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for class_goals
DROP POLICY IF EXISTS "allow public read class_goals" ON class_goals;
CREATE POLICY "allow public read class_goals" ON class_goals FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow anyone manage class_goals" ON class_goals;
CREATE POLICY "allow anyone manage class_goals" ON class_goals FOR ALL USING (true) WITH CHECK (true);


-- ----------------------------------------------------
-- Teachers Hub & Teens Tribe: Aquifer API Sync Support
-- ----------------------------------------------------

-- Add new columns for Aquifer API resources
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS source text DEFAULT 'github_raw';
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS aquifer_resource_id integer;
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS aquifer_reference_id integer;
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS resource_name text;
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS resource_type text;
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS resource_collection_code text;
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS resource_collection_attribution text;
ALTER TABLE bible_study_notes ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Add UNIQUE constraint on aquifer_resource_id for upsert support
ALTER TABLE bible_study_notes DROP CONSTRAINT IF EXISTS unique_aquifer_resource_id;
ALTER TABLE bible_study_notes ADD CONSTRAINT unique_aquifer_resource_id UNIQUE (aquifer_resource_id);

-- Create table to track Aquifer sync checkpoint state (singleton row)
CREATE TABLE IF NOT EXISTS aquifer_sync_state (
  id integer PRIMARY KEY DEFAULT 1,
  last_sync_timestamp timestamptz NOT NULL DEFAULT '2020-01-01T00:00:00Z',
  CHECK (id = 1)
);

-- Seed singleton sync state row
INSERT INTO aquifer_sync_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable RLS for aquifer_sync_state
ALTER TABLE aquifer_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow public read aquifer_sync_state" ON aquifer_sync_state;
CREATE POLICY "allow public read aquifer_sync_state" ON aquifer_sync_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow anyone manage aquifer_sync_state" ON aquifer_sync_state;
CREATE POLICY "allow anyone manage aquifer_sync_state" ON aquifer_sync_state FOR ALL USING (true) WITH CHECK (true);


