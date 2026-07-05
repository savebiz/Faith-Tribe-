-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read access"
  ON site_settings FOR SELECT
  USING (true);

-- Allow authenticated/service role writes
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
CREATE POLICY "Allow anonymous read access for study notes"
  ON bible_study_notes FOR SELECT
  USING (true);

-- Allow anonymous upsert access for ingestion
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
