export const BOOK_CODES: Record<string, string> = {
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

// Common abbreviations a user might actually type into the search box,
// resolved back to the canonical keys above (SEPARATE concern from BOOK_CODES:
// this is "what a human types," BOOK_CODES is "what the API needs." Keep decoupled.)
export const BOOK_ALIASES: Record<string, string> = {
  gen: 'genesis',
  exo: 'exodus', ex: 'exodus',
  lev: 'leviticus',
  num: 'numbers',
  deut: 'deuteronomy', deu: 'deuteronomy',
  josh: 'joshua', jos: 'joshua',
  judg: 'judges', jdg: 'judges',
  rut: 'ruth',
  '1 sam': '1 samuel', '1sam': '1 samuel', 'I sam': '1 samuel', 'Isam': '1 samuel', 
  '2 sam': '2 samuel', '2sam': '2 samuel', 'II sam': '2 samuel', 'IIsam': '2 samuel',
  '1 kgs': '1 kings',  '1 kin': '1 kings', 'I kin': '1 kings', 'I kgs': '1 kings',
  '2 kgs': '2 kings', '2 kin': '1 kings', 'II kin': '1 kings', 'II kgs': '1 kings',
  '1 chron': '1 chronicles', '1 chr': '1 chronicles', 'I chron': '1 chronicles', 'I chr': '1 chronicles',
  '2 chron': '2 chronicles', '2 chr': '2 chronicles', 'II chron': '2 chronicles', 'II chr': '2 chronicles',
  ezr: 'ezra',
  neh: 'nehemiah',
  est: 'esther',
  ps: 'psalms', psa: 'psalms', psalm: 'psalms',
  prov: 'proverbs', pro: 'proverbs',
  eccl: 'ecclesiastes', ecc: 'ecclesiastes',
  song: 'song of solomon', sos: 'song of solomon', sng: 'song of solomon',
  isa: 'isaiah',
  jer: 'jeremiah',
  lam: 'lamentations',
  ezek: 'ezekiel', ezk: 'ezekiel',
  dan: 'daniel',
  hos: 'hosea',
  jl: 'joel',
  am: 'amos',
  obad: 'obadiah', oba: 'obadiah',
  jnh: 'jonah',
  mic: 'micah',
  nah: 'nahum',
  hab: 'habakkuk',
  zeph: 'zephaniah', zep: 'zephaniah',
  haggai: 'haggai', hag: 'haggai',
  zech: 'zechariah', zec: 'zechariah',
  mal: 'malachi',
  matt: 'matthew', mt: 'matthew',
  mk: 'mark', mrk: 'mark',
  lk: 'luke', luk: 'luke',
  jn: 'john', jhn: 'john',
  ac: 'acts',
  rom: 'romans',
  '1 cor': '1 corinthians',  '1cor': '1 corinthians', 'I cor': '1 corinthians',  'Icor': '1 corinthians',
  '2 cor': '2 corinthians', '2cor': '2 corinthians', 'II cor': '2 corinthians', 'IIcor': '2 corinthians',
  gal: 'galatians',
  eph: 'ephesians',
  phil: 'philippians', php: 'philippians',
  col: 'colossians',
  '1 thess': '1 thessalonians', '1thess': '1 thessalonians', 'I thess': '1 thessalonians', 'Ithess': '1 thessalonians',
  '2 thess': '2 thessalonians', '2thess': '2 thessalonians', 'II thess': '2 thessalonians', 'IIthess': '2 thessalonians',
  '1 tim': '1 timothy', '1tim': '1 timothy', 'I tim': '1 timothy', 'Itim': '1 timothy',
  '2 tim': '2 timothy', '2tim': '2 timothy', 'II tim': '2 timothy', 'IItim': '2 timothy',
  tit: 'titus',
  phlm: 'philemon', phm: 'philemon',
  heb: 'hebrews',
  jas: 'james', jm: 'james',
  '1 pet': '1 peter', '1pet': '1 peter', 'I pet': '1 peter', 'Ipet': '1 peter',
  '2 pet': '2 peter', '2pet': '2 peter', 'II pet': '2 peter', 'IIpet': '2 peter',
  '1 jn': '1 john', '1jn': '1 john', 'I jn': '1 john', 'Ijn': '1 john',
  '2 jn': '2 john', '2jn': '2 john', 'II jn': '2 john', 'IIjn': '2 john',
  '3 jn': '3 john', '3jn': '3 john', 'III jn': '3 john', 'IIIjn': '3 john',
  jd: 'jude',
  rev: 'revelation',
};

// Full book names mapped to their canonical 3-letter USFM codes
export const BOOK_NAMES: Record<string, string> = {
  // Old Testament
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms',
  PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah',
  JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah',
  NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah',
  MAL: 'Malachi',

  // New Testament
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans',
  '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians',
  PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians',
  '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews',
  JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John',
  '3JN': '3 John', JUD: 'Jude', REV: 'Revelation'
};

// Dynamically construct BOOK_ABBREVIATIONS combining codes and aliases
export const BOOK_ABBREVIATIONS: Record<string, string> = {};

// First, map direct book names (e.g. 'genesis' -> 'GEN')
Object.entries(BOOK_CODES).forEach(([name, code]) => {
  BOOK_ABBREVIATIONS[name] = code;
});

// Second, map aliases (e.g. 'gen' -> 'genesis' -> 'GEN')
Object.entries(BOOK_ALIASES).forEach(([alias, name]) => {
  const code = BOOK_CODES[name];
  if (code) {
    BOOK_ABBREVIATIONS[alias] = code;
  }
});

export function parseScriptureReference(input: string): { bookCode: string; chapter: string; verse: number | null } | null {
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
  
  // Matches chapter and optional verse (e.g., "3", "3:16", "3:16-18")
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
