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
  const url = `https://4.dbt.io/api/bibles/filesets/${filesetId}?key=${API_KEY}&v=4`;
  console.log("Calling endpoint:", url.replace(API_KEY, '[HIDDEN_KEY]'));
  const res = await fetch(url);
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Keys of response:", Object.keys(data));
  console.log("Response data keys:", data.data ? Object.keys(data.data) : "No data");
  console.log("Response data (sample):", JSON.stringify(data.data || data).slice(0, 1000));
}

main().catch(console.error);
