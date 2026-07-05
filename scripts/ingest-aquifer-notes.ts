import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Pinned to stable release commit from 2026-06-25
const COMMIT_SHA = '0cff9d62f171c38af6f5e088f697f7ab4270568a';
const BASE_URL = `https://raw.githubusercontent.com/BibleAquifer/AquiferOpenStudyNotes/${COMMIT_SHA}/eng/json`;

// Retrieve Supabase environment variables if present
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);
const supabase = isRealSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Ensure target directory exists for local fallback files
const LOCAL_CACHE_DIR = path.join(process.cwd(), 'public', 'bible-study-notes');
if (!fs.existsSync(LOCAL_CACHE_DIR)) {
  fs.mkdirSync(LOCAL_CACHE_DIR, { recursive: true });
}

async function ingestBook(bookNumber: string) {
  const url = `${BASE_URL}/${bookNumber}.content.json`;
  console.log(`\n--------------------------------------------`);
  console.log(`Fetching: ${url}`);
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch book ${bookNumber}: status ${res.status}`);
  }
  const entries = (await res.json()) as any[];

  // Process data for Supabase
  const rows = entries.map((entry: any) => ({
    ref: entry.index_reference,
    usfm_start: entry.associations?.passage?.[0]?.start_ref_usfm ?? null,
    usfm_end: entry.associations?.passage?.[0]?.end_ref_usfm ?? null,
    title: entry.title,
    content_html: entry.content,
    acai: entry.associations?.acai ?? [],
    related_resources: entry.associations?.resource ?? [],
    review_level: entry.review_level,
    language: entry.language,
    source_version: entry.version,
  }));

  // Create optimized, lightweight rows for local client-side fallback
  const localRows = entries.map((entry: any) => ({
    ref: entry.index_reference,
    usfm_start: entry.associations?.passage?.[0]?.start_ref_usfm ?? null,
    title: entry.title,
    content_html: entry.content,
    review_level: entry.review_level,
  }));

  // Save local fallback JSON file
  const localFilePath = path.join(LOCAL_CACHE_DIR, `${bookNumber}.json`);
  fs.writeFileSync(localFilePath, JSON.stringify(localRows, null, 2), 'utf-8');
  console.log(`Saved local cache: public/bible-study-notes/${bookNumber}.json (${localRows.length} entries)`);

  // Upsert to Supabase if configured
  if (isRealSupabase && supabase) {
    console.log(`Upserting ${rows.length} entries into Supabase for book ${bookNumber}...`);
    const { error } = await supabase.from('bible_study_notes').upsert(rows, { onConflict: 'ref' });
    if (error) {
      console.error(`Supabase error for book ${bookNumber}: ${error.message}`);
    } else {
      console.log(`Supabase upsert complete.`);
    }
  } else {
    console.log(`Supabase not configured/available. Skipping database insert.`);
  }
}

async function main() {
  console.log('Starting Bible Aquifer Open Study Notes Ingestion...');
  console.log(`Remote Source Commit: ${COMMIT_SHA}`);
  if (isRealSupabase) {
    console.log(`Database Target: ${supabaseUrl}`);
  } else {
    console.log('Database Target: NONE (running in local-only fallback mode)');
  }

  const allBookNumbers = Array.from({ length: 66 }, (_, i) => String(i + 1).padStart(2, '0'));
  for (const book of allBookNumbers) {
    try {
      await ingestBook(book);
      // Wait 150ms to be polite to GitHub raw file hosting
      await new Promise((r) => setTimeout(r, 150));
    } catch (e: any) {
      console.error(`Error processing book ${book}:`, e.message || e);
    }
  }
  console.log('\n============================================');
  console.log('Ingestion process completed successfully!');
}

main().catch((err) => {
  console.error('Unhandled fatal error in ingestion process:', err);
  process.exit(1);
});
