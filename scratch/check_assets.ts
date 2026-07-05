import http from 'node:http';
import https from 'node:https';

function getUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

async function run() {
  console.log("Fetching root index.html...");
  const html = await getUrl('https://faith-tribe-tau.vercel.app/');
  
  // Find script references
  const match = html.match(/src="([^"]+\.js)"/);
  if (match) {
    const jsUrl = 'https://faith-tribe-tau.vercel.app' + match[1];
    console.log(`Found JS bundle: ${jsUrl}`);
    console.log("Fetching JS bundle...");
    const jsContent = await getUrl(jsUrl);
    const hasCurriculum = jsContent.includes("Curriculum Library");
    const hasKonnect = jsContent.includes("Konnect");
    console.log(`Contains 'Curriculum Library' text: ${hasCurriculum}`);
    console.log(`Contains 'Konnect' text: ${hasKonnect}`);
  } else {
    console.log("No JS bundle found in index.html! Content length:", html.length);
  }
}

run().catch(console.error);
