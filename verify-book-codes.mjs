// verify-book-codes.mjs
//
// Verifies all 66 book codes against the LIVE YouVersion Platform API.
// Usage:
//   export YVP_APP_KEY="your_app_key_here"
//   node verify-book-codes.mjs
// Requires Node 18+ (built-in fetch). No other dependencies.

export const BOOK_CODES = {
  // Old Testament
  genesis: 'GEN',
  exodus: 'EXO',
  leviticus: 'LEV',
  numbers: 'NUM',
  deuteronomy: 'DEU',
  joshua: 'JOS',
  judges: 'JDG',
  ruth: 'RUT',
  '1 samuel': '1SA',
  '2 samuel': '2SA',
  '1 kings': '1KI',
  '2 kings': '2KI',
  '1 chronicles': '1CH',
  '2 chronicles': '2CH',
  ezra: 'EZR',
  nehemiah: 'NEH',
  esther: 'EST',
  job: 'JOB',
  psalms: 'PSA',
  psalm: 'PSA',
  proverbs: 'PRO',
  ecclesiastes: 'ECC',
  'song of solomon': 'SNG',
  'song of songs': 'SNG',
  isaiah: 'ISA',
  jeremiah: 'JER',
  lamentations: 'LAM',
  ezekiel: 'EZK',
  daniel: 'DAN',
  hosea: 'HOS',
  joel: 'JOL',
  amos: 'AMO',
  obadiah: 'OBA',
  jonah: 'JON',
  micah: 'MIC',
  nahum: 'NAM',
  habakkuk: 'HAB',
  zephaniah: 'ZEP',
  haggai: 'HAG',
  zechariah: 'ZEC',
  malachi: 'MAL',

  // New Testament
  matthew: 'MAT',
  mark: 'MRK',
  luke: 'LUK',
  john: 'JHN',
  acts: 'ACT',
  romans: 'ROM',
  '1 corinthians': '1CO',
  '2 corinthians': '2CO',
  galatians: 'GAL',
  ephesians: 'EPH',
  philippians: 'PHP',
  colossians: 'COL',
  '1 thessalonians': '1TH',
  '2 thessalonians': '2TH',
  '1 timothy': '1TI',
  '2 timothy': '2TI',
  titus: 'TIT',
  philemon: 'PHM',
  hebrews: 'HEB',
  james: 'JAS',
  '1 peter': '1PE',
  '2 peter': '2PE',
  '1 john': '1JN',
  '2 john': '2JN',
  '3 john': '3JN',
  jude: 'JUD',
  revelation: 'REV',
};

const APP_KEY = process.env.YVP_APP_KEY;
const VERSION_ID = 3034; // Berean Standard Bible — baseline test version

if (!APP_KEY) {
  console.error('Missing YVP_APP_KEY environment variable. Export your App Key first.');
  process.exit(1);
}

async function checkBook(name, code) {
  const url = `https://api.youversion.com/v1/bibles/${VERSION_ID}/passages/${code}.1.1`;
  try {
    const res = await fetch(url, { headers: { 'X-YVP-App-Key': APP_KEY } });
    if (res.ok) return { name, code, status: 'OK', httpStatus: res.status };
    const body = await res.text();
    return { name, code, status: 'FAIL', httpStatus: res.status, body: body.slice(0, 200) };
  } catch (err) {
    return { name, code, status: 'ERROR', error: err.message };
  }
}

async function main() {
  console.log(`Verifying ${Object.keys(BOOK_CODES).length} book codes against the live API...\n`);
  const results = [];
  for (const [name, code] of Object.entries(BOOK_CODES)) {
    const result = await checkBook(name, code);
    results.push(result);
    const icon = result.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${name.padEnd(20)} ${code.padEnd(6)} ${result.status}${result.httpStatus ? ` (${result.httpStatus})` : ''}`);
    await new Promise((r) => setTimeout(r, 150)); // be courteous to the API
  }
  const failures = results.filter((r) => r.status !== 'OK');
  console.log('\n---');
  if (failures.length === 0) {
    console.log(`All ${results.length} book codes verified successfully against the live API.`);
  } else {
    console.log(`${failures.length} book code(s) FAILED — fix before shipping:\n`);
    failures.forEach((f) => {
      console.log(`  ${f.name} (${f.code}): ${f.status}${f.body ? ' — ' + f.body : ''}${f.error ? ' — ' + f.error : ''}`);
    });
    process.exit(1);
  }
}

main();
