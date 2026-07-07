import fs from 'fs';
import path from 'path';

function loadEnvKey() {
  try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/BIBLE_BRAIN_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (match) return match[1].trim();
    }
  } catch (e) {
    console.error("Error reading env file:", e);
  }
  return '';
}

const API_KEY = loadEnvKey();
if (!API_KEY) {
  console.error("Error: BIBLE_BRAIN_API_KEY not found in .env.local");
  process.exit(1);
}

const LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'yor', name: 'Yoruba' },
  { code: 'ibo', name: 'Igbo' },
  { code: 'hau', name: 'Hausa' }
];

async function discoverForLanguage(langCode) {
  const url = `https://4.dbt.io/api/bibles?language_code=${langCode}&media=audio&key=${API_KEY}&v=4`;
  console.log(`Fetching filesets for ${langCode} from ${url.replace(API_KEY, '[HIDDEN_KEY]')}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch for ${langCode}: status ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Error fetching for ${langCode}:`, err);
    return null;
  }
}

async function main() {
  const allDiscovered = [];

  for (const lang of LANGUAGES) {
    const response = await discoverForLanguage(lang.code);
    const bibles = response?.data || [];
    console.log(`Discovered ${bibles.length || 0} bibles for ${lang.name}`);
    
    if (bibles.length > 0) {
      for (const bible of bibles) {
        if (!bible.filesets) continue;
        for (const bucketKey of Object.keys(bible.filesets)) {
          const filesetList = bible.filesets[bucketKey] || [];
          for (const f of filesetList) {
            const isAudio = f.type && (f.type.includes('audio') || f.type.includes('drama'));
            if (isAudio) {
              const code = f.id.slice(-2);
              allDiscovered.push({
                fileset_id: f.id,
                language_code: lang.code,
                language_name: lang.name,
                bible_name: bible.name || bible.abbr || 'Audio Bible',
                media_type: code === 'SA' ? 'SA' : 'DA',
                is_verified: true
              });
            }
          }
        }
      }
    }
    // Rate limit delay to stay under 60 req/min
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`Total audio filesets collected: ${allDiscovered.length}`);
  if (allDiscovered.length > 0) {
    const outputPath = path.resolve('lib/discovered_filesets.json');
    fs.writeFileSync(outputPath, JSON.stringify(allDiscovered, null, 2), 'utf8');
    console.log(`Saved discovered filesets to ${outputPath}`);
  } else {
    console.log("No audio filesets were found.");
  }
}

main().catch(err => {
  console.error("Discovery script failed:", err);
});
