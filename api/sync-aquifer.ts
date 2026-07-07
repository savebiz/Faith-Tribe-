import { createClient } from '@supabase/supabase-js';

// Mappings from English Book Names / Common Abbreviations to USFM Book Codes
const BOOK_NAME_TO_USFM: Record<string, string> = {
  genesis: 'GEN', gen: 'GEN',
  exodus: 'EXO', exo: 'EXO',
  leviticus: 'LEV', lev: 'LEV',
  numbers: 'NUM', num: 'NUM',
  deuteronomy: 'DEU', deu: 'DEU',
  joshua: 'JOS', jos: 'JOS',
  judges: 'JDG', jdg: 'JDG',
  ruth: 'RUT', rut: 'RUT',
  '1 samuel': '1SA', '1sa': '1SA', '1 sam': '1SA',
  '2 samuel': '2SA', '2sa': '2SA', '2 sam': '2SA',
  '1 kings': '1KI', '1ki': '1KI', '1 kin': '1KI',
  '2 kings': '2KI', '2ki': '2KI', '2 kin': '2KI',
  '1 chronicles': '1CH', '1ch': '1CH', '1 chr': '1CH',
  '2 chronicles': '2CH', '2ch': '2CH', '2 chr': '2CH',
  ezra: 'EZR', ezr: 'EZR',
  nehemiah: 'NEH', neh: 'NEH',
  esther: 'EST', est: 'EST',
  job: 'JOB',
  psalms: 'PSA', psa: 'PSA', psalm: 'PSA',
  proverbs: 'PRO', pro: 'PRO', prov: 'PRO',
  ecclesiastes: 'ECC', ecc: 'ECC',
  'song of solomon': 'SNG', sng: 'SNG', song: 'SNG',
  isaiah: 'ISA', isa: 'ISA',
  jeremiah: 'JER', jer: 'JER',
  lamentations: 'LAM', lam: 'LAM',
  ezekiel: 'EZK', ezk: 'EZK',
  daniel: 'DAN', dan: 'DAN',
  hosea: 'HOS', hos: 'HOS',
  joel: 'JOL', jol: 'JOL',
  amos: 'AMO', amo: 'AMO',
  obadiah: 'OBD', obd: 'OBD',
  jonah: 'JON', jon: 'JON',
  micah: 'MIC', mic: 'MIC',
  nahum: 'NAM', nam: 'NAM',
  habakkuk: 'HAB', hab: 'HAB',
  zephaniah: 'ZEP', zep: 'ZEP',
  haggai: 'HAG', hag: 'HAG',
  zechariah: 'ZEC', zec: 'ZEC',
  malachi: 'MAL', mal: 'MAL',
  matthew: 'MAT', mat: 'MAT', matt: 'MAT',
  mark: 'MRK', mrk: 'MRK',
  luke: 'LUK', luk: 'LUK',
  john: 'JHN', jhn: 'JHN', jn: 'JHN',
  acts: 'ACT', act: 'ACT',
  romans: 'ROM', rom: 'ROM',
  '1 corinthians': '1CO', '1co': '1CO', '1 cor': '1CO',
  '2 corinthians': '2CO', '2co': '2CO', '2 cor': '2CO',
  galatians: 'GAL', gal: 'GAL',
  ephesians: 'EPH', eph: 'EPH',
  philippians: 'PHP', php: 'PHP', phil: 'PHP',
  colossians: 'COL', col: 'COL',
  '1 thes': '1TH', '1th': '1TH', '1 thessalonians': '1TH',
  '2 thes': '2TH', '2th': '2TH', '2 thessalonians': '2TH',
  '1 tim': '1TI', '1ti': '1TI', '1 timothy': '1TI',
  '2 tim': '2TI', '2ti': '2TI', '2 timothy': '2TI',
  titus: 'TIT', tit: 'TIT',
  philemon: 'PHM', phm: 'PHM',
  hebrews: 'HEB', heb: 'HEB',
  james: 'JAS', jas: 'JAS',
  '1 peter': '1PE', '1pe': '1PE', '1 pet': '1PE',
  '2 peter': '2PE', '2pe': '2PE', '2 pet': '2PE',
  '1 john': '1JN', '1jn': '1JN',
  '2 john': '2JN', '2jn': '2JN',
  '3 john': '3JN', '3jn': '3JN',
  jude: 'JUD', jud: 'JUD',
  revelation: 'REV', rev: 'REV', revs: 'REV'
};

function getBookCode(name: string): string | null {
  const clean = name.trim().toLowerCase();
  return BOOK_NAME_TO_USFM[clean] || null;
}

function parseReferenceToUsfm(refStr: string): { usfmStart: string; usfmEnd: string; ref: string } | null {
  if (!refStr) return null;
  // Match e.g. "Genesis 1:1", "John 3:16-17", "1 Corinthians 13:4"
  const match = refStr.match(/([1-3]?\s*[A-Za-z]+)\s*(\d+):(\d+)(?:-(\d+))?/);
  if (match) {
    const bookName = match[1];
    const chapter = match[2];
    const startVerse = match[3];
    const endVerse = match[4] || startVerse;
    const bookCode = getBookCode(bookName);
    if (bookCode) {
      return {
        usfmStart: `${bookCode} ${chapter}:${startVerse}`,
        usfmEnd: `${bookCode} ${chapter}:${endVerse}`,
        ref: `${bookCode} ${chapter}:${startVerse}${match[4] ? '-' + endVerse : ''}`
      };
    }
  }
  return null;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.AQUIFER_API_KEY || '';
  if (!apiKey) {
    return res.status(500).json({ error: 'AQUIFER_API_KEY is not configured on the server' });
  }

  // Simple Auth check: Trigger allowed if:
  // - Vercel Cron header matches: 'x-vercel-cron' exists
  // - Or passed 'api-key' matches process.env.AQUIFER_API_KEY
  // - Or Bearer Authorization matches
  const hasCronHeader = !!req.headers['x-vercel-cron'];
  const reqApiKey = req.headers['x-api-key'] || req.query.key;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  const isAuth = hasCronHeader || reqApiKey === apiKey || token === apiKey;
  if (!isAuth && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized call to Aquifer sync handler' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase credentials are not configured on the server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Local collection metadata caching to avoid repeating collection fetches
  const collectionAttributionCache: Record<string, string> = {};

  async function fetchCollectionAttribution(collectionCode: string): Promise<string> {
    if (!collectionCode) return '© Aquifer Bible';
    if (collectionAttributionCache[collectionCode]) {
      return collectionAttributionCache[collectionCode];
    }
    try {
      const url = `https://api.aquifer.bible/resources/collections/${collectionCode}`;
      const response = await fetch(url, { headers: { 'api-key': apiKey } });
      if (response.ok) {
        const data = await response.json();
        // Sourcing license/attribution from collection metadata
        const attribution = data.copyright?.longDisplayHtml || data.copyright?.shortDisplayHtml || data.license?.name || '© Aquifer Bible';
        collectionAttributionCache[collectionCode] = attribution;
        return attribution;
      }
    } catch (err) {
      console.warn(`Failed to fetch collection attribution for ${collectionCode}:`, err);
    }
    return '© Aquifer Bible';
  }

  async function fetchAndStoreResource(contentId: number): Promise<boolean> {
    try {
      const url = `https://api.aquifer.bible/resources/${contentId}?contentTextType=Html`;
      const response = await fetch(url, { headers: { 'api-key': apiKey } });
      if (!response.ok) {
        console.warn(`Failed to fetch Aquifer resource ${contentId}: status ${response.status}`);
        return false;
      }
      
      const resource = await response.json();
      const collectionCode = resource.grouping?.collectionCode || '';
      const attribution = await fetchCollectionAttribution(collectionCode);
      
      // Parse reference details from name or grouping properties
      const nameRef = resource.localizedName || resource.name || '';
      const parsedRef = parseReferenceToUsfm(nameRef);
      if (!parsedRef) {
        console.warn(`Could not parse scripture passage ref from resource name "${nameRef}" for id ${contentId}`);
        return false;
      }

      const { data, error } = await supabaseAdmin.from('bible_study_notes').upsert({
        ref: parsedRef.ref,
        usfm_start: parsedRef.usfmStart,
        usfm_end: parsedRef.usfmEnd,
        title: resource.localizedName || resource.name,
        content_html: resource.content, // HTML output format requested from API
        review_level: resource.reviewLevel,
        resource_name: resource.name,
        resource_type: resource.grouping?.type || 'StudyNotes',
        resource_collection_code: collectionCode,
        resource_collection_attribution: attribution,
        language: resource.language?.languageCode ?? 'eng',
        source: 'aquifer_api',
        tier: 'advanced', // All Aquifer notes mapped to advanced/Go Deeper
        review_status: 'approved',
        last_synced_at: new Date().toISOString()
      }, { onConflict: 'aquifer_resource_id' });

      if (error) {
        console.error(`Supabase write error for resource ${contentId}:`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error(`Error storing resource ${contentId}:`, err.message || err);
      return false;
    }
  }

  const backfillBook = req.query.backfillBook || '';
  if (backfillBook) {
    // ---- Seeding Mode: Backfill Book-by-Book ----
    const bookCode = String(backfillBook).toUpperCase();
    console.log(`Starting manual backfill for book: ${bookCode}`);
    
    let offset = 0;
    let totalIngested = 0;
    
    try {
      while (true) {
        const searchUrl = `https://api.aquifer.bible/resources/search?bookCode=${bookCode}&resourceType=StudyNotes&languageCode=eng&limit=100&offset=${offset}`;
        const searchRes = await fetch(searchUrl, { headers: { 'api-key': apiKey } });
        if (!searchRes.ok) {
          return res.status(searchRes.status).json({ error: `Search API failed: status ${searchRes.status}` });
        }
        
        const searchData = await searchRes.json();
        const items = searchData.items || [];
        if (items.length === 0) break;
        
        for (const item of items) {
          const ok = await fetchAndStoreResource(item.id);
          if (ok) totalIngested++;
          await new Promise(r => setTimeout(r, 150)); // rate pacing
        }
        
        if (items.length < 100) break; // last page
        offset += 100;
      }
      
      return res.status(200).json({
        success: true,
        mode: 'backfill',
        book: bookCode,
        totalItemsIngested: totalIngested
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Backfill failed: ${err.message}` });
    }
  } else {
    // ---- Cron Mode: Incremental updates sync ----
    try {
      const { data: syncState, error: stateError } = await supabaseAdmin
        .from('aquifer_sync_state')
        .select('last_sync_timestamp')
        .eq('id', 1)
        .maybeSingle();

      if (stateError) throw stateError;
      
      const startTimestamp = syncState?.last_sync_timestamp || '2020-01-01T00:00:00Z';
      const endTimestamp = new Date().toISOString();
      
      let offset = 0;
      const allUpdates: any[] = [];
      
      while (true) {
        const updatesUrl = `https://api.aquifer.bible/resources/updates?startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&languageCode=eng&limit=100&offset=${offset}`;
        const updatesRes = await fetch(updatesUrl, { headers: { 'api-key': apiKey } });
        if (!updatesRes.ok) {
          return res.status(updatesRes.status).json({ error: `Updates API failed: status ${updatesRes.status}` });
        }
        
        const data = await updatesRes.json();
        const items = data.items || [];
        allUpdates.push(...items);
        
        if (items.length < 100) break;
        offset += 100;
      }
      
      console.log(`Found ${allUpdates.length} Aquifer updates since ${startTimestamp}`);
      let totalSynced = 0;
      
      for (const update of allUpdates) {
        if (update.resourceId) {
          const ok = await fetchAndStoreResource(update.resourceId);
          if (ok) totalSynced++;
          await new Promise(r => setTimeout(r, 150));
        }
      }
      
      // Update singleton sync state only if execution runs to completion
      await supabaseAdmin
        .from('aquifer_sync_state')
        .update({ last_sync_timestamp: endTimestamp })
        .eq('id', 1);

      return res.status(200).json({
        success: true,
        mode: 'incremental_sync',
        startTimestamp,
        endTimestamp,
        totalItemsUpdatesFound: allUpdates.length,
        totalItemsSynced: totalSynced
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Sync failed: ${err.message}` });
    }
  }
}
