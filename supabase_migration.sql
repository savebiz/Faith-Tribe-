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
  USING (true)
  WITH CHECK (true);

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
  USING (true)
  WITH CHECK (true);

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
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_staff_zone() RETURNS zone_scope AS $$
  SELECT scoped_zone FROM staff WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
