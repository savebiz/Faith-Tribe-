// Self-contained test script
const BOOK_CODES = {
  genesis: 'GEN', exodus: 'EXO', leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU',
  joshua: 'JOS', judges: 'JDG', ruth: 'RUT', '1 samuel': '1SA', '2 samuel': '2SA',
  '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
  ezra: 'EZR', nehemiah: 'NEH', esther: 'EST', job: 'JOB', psalms: 'PSA', psalm: 'PSA',
  proverbs: 'PRO', ecclesiastes: 'ECC', 'song of solomon': 'SNG', 'song of songs': 'SNG',
  isaiah: 'ISA', jeremiah: 'JER', lamentations: 'LAM', ezekiel: 'EZK', daniel: 'DAN',
  hosea: 'HOS', joel: 'JOL', amos: 'AMO', obadiah: 'OBA', jonah: 'JON', micah: 'MIC',
  nahum: 'NAM', habakkuk: 'HAB', zephaniah: 'ZEP', haggai: 'HAG', zechariah: 'ZEC',
  malachi: 'MAL', matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT',
  romans: 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO', galatians: 'GAL',
  ephesians: 'EPH', philippians: 'PHP', colossians: 'COL', '1 thessalonians': '1TH',
  '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI', titus: 'TIT',
  philemon: 'PHM', hebrews: 'HEB', james: 'JAS', '1 peter': '1PE', '2 peter': '2PE',
  '1 john': '1JN', '2 john': '2JN', '3 john': '3JN', jude: 'JUD', revelation: 'REV'
};

const BOOK_ALIASES = {
  gen: 'genesis', exo: 'exodus', ex: 'exodus', lev: 'leviticus', num: 'numbers',
  deut: 'deuteronomy', deu: 'deuteronomy', josh: 'joshua', jos: 'joshua',
  judg: 'judges', jdg: 'judges', rut: 'ruth', '1 sam': '1 samuel', '1sam': '1 samuel',
  '2 sam': '2 samuel', '2sam': '2 samuel', '1 kgs': '1 kings', '2 kgs': '2 kings',
  '1 chr': '1 chronicles', '2 chr': '2 chronicles', ezr: 'ezra', neh: 'nehemiah',
  est: 'esther', ps: 'psalms', psa: 'psalms', prov: 'proverbs', pro: 'proverbs',
  eccl: 'ecclesiastes', ecc: 'ecclesiastes', song: 'song of solomon', sos: 'song of solomon',
  isa: 'isaiah', jer: 'jeremiah', lam: 'lamentations', ezek: 'ekekiel', ezk: 'ezekiel',
  dan: 'daniel', hos: 'hosea', jl: 'joel', am: 'amos', obad: 'obadiah', oba: 'obadiah',
  jnh: 'jonah', mic: 'micah', nah: 'nahum', hab: 'habakkuk', zeph: 'zephaniah',
  zep: 'zephaniah', hag: 'haggai', zech: 'zechariah', zec: 'zechariah', mal: 'malachi',
  matt: 'matthew', mt: 'matthew', mk: 'mark', mrk: 'mark', lk: 'luke', luk: 'luke',
  jn: 'john', jhn: 'john', ac: 'acts', rom: 'romans', '1 cor': '1 corinthians',
  '2 cor': '2 corinthians', gal: 'galatians', eph: 'ephesians', phil: 'philippians',
  php: 'philippians', col: 'colossians', '1 thess': '1 thessalonians', '2 thess': '2 thessalonians',
  '1 tim': '1 timothy', '2 tim': '2 timothy', tit: 'titus', phlm: 'philemon',
  phm: 'philemon', heb: 'hebrews', jas: 'james', jm: 'james', '1 pet': '1 peter',
  '2 pet': '2 peter', '1 jn': '1 john', '2 jn': '2 john', '3 jn': '3 john',
  jd: 'jude', rev: 'revelation'
};

const BOOK_ABBREVIATIONS = {};
Object.entries(BOOK_CODES).forEach(([name, code]) => {
  BOOK_ABBREVIATIONS[name] = code;
});
Object.entries(BOOK_ALIASES).forEach(([alias, name]) => {
  const code = BOOK_CODES[name];
  if (code) {
    BOOK_ABBREVIATIONS[alias] = code;
  }
});

function parseScriptureReference(input) {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;
  
  const sortedKeys = Object.keys(BOOK_ABBREVIATIONS).sort((a, b) => b.length - a.length);
  let matchedBookKey = '';
  
  for (const key of sortedKeys) {
    if (clean.startsWith(key)) {
      matchedBookKey = key;
      break;
    }
  }
  
  if (!matchedBookKey) return null;
  
  const bookCode = BOOK_ABBREVIATIONS[matchedBookKey];
  let remaining = clean.slice(matchedBookKey.length).trim();
  if (remaining.startsWith('.')) {
    remaining = remaining.substring(1).trim();
  }
  
  const match = remaining.match(/^(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
  if (!match && remaining.length > 0) return null;
  
  const chapterNum = match ? match[1] : '1';
  const startVerse = match && match[2] ? Number(match[2]) : null;
  
  return {
    bookCode,
    chapter: chapterNum,
    verse: startVerse
  };
}

function testConvertRefLyUrl(url, currentVersionId) {
  if (!url || !url.startsWith('https://ref.ly/')) {
    return { href: url, isInternal: false };
  }

  try {
    const refPath = decodeURIComponent(url.substring('https://ref.ly/'.length));
    const match = refPath.match(/^([1-3]?\s*[A-Za-z\s]+?)\.?\s*(\d+)(?:[:.](\d+))?/);
    if (match) {
      const rawBook = match[1].trim();
      const chapter = match[2];
      const verse = match[3] || null;

      const parsed = parseScriptureReference(`${rawBook} ${chapter}${verse ? ':' + verse : ''}`);
      if (parsed) {
        let versionQuery = currentVersionId ? `?version=${currentVersionId}` : '';
        if (parsed.verse) {
          versionQuery += versionQuery ? `&verse=${parsed.verse}` : `?verse=${parsed.verse}`;
        }
        return {
          href: `/bible/${parsed.bookCode}/${parsed.chapter}${versionQuery}`,
          isInternal: true
        };
      }
    }
  } catch (e) {
    console.error('Error parsing ref.ly URL:', e);
  }

  return { href: url, isInternal: false };
}

const testUrls = [
  'https://ref.ly/Matt19:21',
  'https://ref.ly/Matt.19.21',
  'https://ref.ly/Gen1:3-Gen2:3',
  'https://ref.ly/Prov8:22-Prov8:31',
  'https://ref.ly/John1:1-John1:3',
  'https://ref.ly/Ps16:5',
  'https://ref.ly/2Cor6:10',
  'https://ref.ly/Jas2:5'
];

console.log("Starting self-contained Link Parsing Test:");
for (const url of testUrls) {
  const result = testConvertRefLyUrl(url, 3034);
  console.log(`URL: ${url} => Internal: ${result.isInternal}, Href: ${result.href}`);
}
