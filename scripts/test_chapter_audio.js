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
  const filesetId = 'ENGESVN1DA';
  const book = 'MAT';
  const chapter = '1';
  const url = `https://4.dbt.io/api/bibles/filesets/${filesetId}/${book}/${chapter}?key=${API_KEY}&v=4`;
  console.log("Calling endpoint:", url.replace(API_KEY, '[HIDDEN_KEY]'));
  const res = await fetch(url);
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Keys of response:", Object.keys(data));
  console.log("Data keys/properties:", data.data ? Object.keys(data.data[0]) : "No data");
  console.log("Response data (first item):", JSON.stringify(data.data ? data.data[0] : data, null, 2));
}

main().catch(console.error);
