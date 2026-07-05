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
