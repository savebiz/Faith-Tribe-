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
  // Let's call /api/bibles without filters to see its structure
  const url = `https://4.dbt.io/api/bibles?key=${API_KEY}&v=4&page=1&limit=5`;
  const res = await fetch(url);
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Keys of top-level response:", Object.keys(data));
  console.log("Top-level data sample:", JSON.stringify(data).slice(0, 1000));
}

main().catch(console.error);
