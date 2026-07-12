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
  const res = await fetch(`https://4.dbt.io/api/bibles?language_code=eng&key=${API_KEY}&v=4`);
  const data = await res.json();
  console.log("Bible list count:", data.data.length);
  const first = data.data[0];
  console.log("Full keys of first bible:", Object.keys(first));
  console.log("First bible sample:", JSON.stringify(first, null, 2));
}

main().catch(console.error);
