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
