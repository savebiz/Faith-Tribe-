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

async function main() {
  // Test with language_code
  const res1 = await fetch(`https://4.dbt.io/api/bibles?language_code=eng&key=${API_KEY}&v=4&limit=3`);
  const data1 = await res1.json();
  console.log("Using language_code=eng - count:", data1.data ? data1.data.length : 0);
  if (data1.data && data1.data.length > 0) {
    console.log("Sample languages in results:", data1.data.map(b => b.language));
  }

  // Test with language_id (if we want) or ISO
  const res2 = await fetch(`https://4.dbt.io/api/bibles?iso=eng&key=${API_KEY}&v=4&limit=3`);
  const data2 = await res2.json();
  console.log("Using iso=eng - count:", data2.data ? data2.data.length : 0);
  if (data2.data && data2.data.length > 0) {
    console.log("Sample languages in results for iso:", data2.data.map(b => b.language));
  }
}

main().catch(console.error);
