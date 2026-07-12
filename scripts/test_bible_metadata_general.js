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

const BIBLE_IDS = ['ENGESV', 'YORDPI', 'IBOBIB', 'HAUDPI'];

async function main() {
  for (const bid of BIBLE_IDS) {
    const url = `https://4.dbt.io/api/bibles/${bid}?key=${API_KEY}&v=4`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Bible ${bid} - Status: ${res.status}`);
    console.log(`Bible ${bid} - Name: ${data.data?.name}`);
    console.log(`Bible ${bid} - Mark: ${data.data?.mark}`);
    console.log(`Bible ${bid} - Copyright: ${data.data?.copyright || 'None'}`);
    console.log(`Bible ${bid} - Providers:`, data.data?.providers ? data.data.providers.map(p => p.name) : []);
    console.log('----------------------------------------------------');
    await new Promise(r => setTimeout(r, 1100));
  }
}

main().catch(console.error);
