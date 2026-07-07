import { createClient } from '@supabase/supabase-js';

const LANGUAGE_FILESETS: Record<string, { ot: string; nt: string }> = {
  eng: { ot: 'ENGESVO1DA', nt: 'ENGESVN1DA' },
  yor: { ot: 'YORDPIO1DA', nt: 'YORDPIN1DA' },
  ibo: { ot: 'IBOBIBO1DA', nt: 'IBOBIBN1DA' },
  hau: { ot: 'HAUDPIO1DA', nt: 'HAUDPIN1DA' }
};

const NT_BOOKS = new Set([
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL',
  '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
  '3JN', 'JUD', 'REV'
]);

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse path or query params
  // e.g. /api/bible-audio/eng/MAT/1 or /api/bible-audio?lang=eng&book=MAT&chapter=1
  let lang = req.query.lang || '';
  let book = req.query.book || '';
  let chapterStr = req.query.chapter || '';
  let filesetId = req.query.filesetId || '';

  // If path pattern is used: e.g. /api/bible-audio/eng/MAT/1
  // req.url might look like /api/bible-audio/eng/MAT/1 or /api/bible-audio/ENGESVN1DA/MAT/1
  const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  // urlParts: ['api', 'bible-audio', 'eng', 'MAT', '1']
  if (urlParts.length >= 5 && urlParts[1] === 'bible-audio') {
    const param1 = urlParts[2]; // eng or filesetId
    book = urlParts[3];
    chapterStr = urlParts[4];

    if (param1.length > 4) {
      filesetId = param1;
    } else {
      lang = param1;
    }
  }

  if (!book || !chapterStr) {
    return res.status(400).json({ error: 'Missing book or chapter parameter' });
  }

  const chapter = Number(chapterStr);
  if (isNaN(chapter)) {
    return res.status(400).json({ error: 'Invalid chapter parameter' });
  }

  // Determine filesetId if not explicitly passed
  if (!filesetId) {
    if (!lang) {
      return res.status(400).json({ error: 'Missing filesetId or lang parameter' });
    }
    const isNewTestament = NT_BOOKS.has(book.toUpperCase());
    const filesetGroup = LANGUAGE_FILESETS[lang.toLowerCase()];
    if (!filesetGroup) {
      return res.status(400).json({ error: `Language '${lang}' is not supported for audio Bibles` });
    }
    filesetId = isNewTestament ? filesetGroup.nt : filesetGroup.ot;
  }

  const apiKey = process.env.BIBLE_BRAIN_API_KEY || '';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  let supabaseAdmin: any = null;
  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  try {
    // 1. Check cache first
    if (supabaseAdmin) {
      const { data: cached, error: cacheErr } = await supabaseAdmin
        .from('audio_chapter_cache')
        .select('*')
        .eq('fileset_id', filesetId)
        .eq('book', book.toUpperCase())
        .eq('chapter', chapter)
        .maybeSingle();

      if (!cacheErr && cached) {
        // Confirm the cached URL is still valid and not expired (DBP URLs typically expire after some time)
        // If the URL has an 'Expires' parameter, we parse and verify
        let isExpired = false;
        try {
          const urlObj = new URL(cached.audio_url);
          const expiresParam = urlObj.searchParams.get('Expires');
          if (expiresParam) {
            const expiresTimestamp = Number(expiresParam) * 1000;
            // If it expires in less than 5 minutes, we treat it as expired and refresh
            if (expiresTimestamp < Date.now() + 5 * 60 * 1000) {
              isExpired = true;
            }
          }
        } catch (e) {
          // If URL is invalid, force refresh
          isExpired = true;
        }

        if (!isExpired) {
          console.log(`Cache hit for ${filesetId}/${book}/${chapter}`);
          return res.status(200).json({
            audioUrl: cached.audio_url,
            timestamps: cached.timestamps,
            copyrightText: cached.copyright_text
          });
        }
        console.log(`Cache hit but URL expired for ${filesetId}/${book}/${chapter} - refreshing...`);
      }
    }

    // 2. Cache miss or expired URL - Fetch from Bible Brain
    if (!apiKey) {
      return res.status(500).json({ error: 'Bible Brain API Key is not configured on the server' });
    }

    // Fetch Audio Path
    const audioUrl = `https://4.dbt.io/api/bibles/filesets/${filesetId}/${book.toUpperCase()}/${chapter}?key=${apiKey}&v=4`;
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return res.status(404).json({ error: `Audio not found for fileset ${filesetId}, passage ${book} ${chapter}` });
    }
    const audioData = await audioRes.json();
    const firstFile = audioData.data?.[0];
    if (!firstFile || !firstFile.path) {
      return res.status(404).json({ error: `No audio files found for fileset ${filesetId}, passage ${book} ${chapter}` });
    }

    const fetchedAudioUrl = firstFile.path;

    // Fetch Copyright Metadata
    const bibleId = filesetId.slice(0, 6);
    const bibleUrl = `https://4.dbt.io/api/bibles/${bibleId}?key=${apiKey}&v=4`;
    let copyrightText = '© Faith Comes By Hearing';
    try {
      const bibleRes = await fetch(bibleUrl);
      if (bibleRes.ok) {
        const bibleData = await bibleRes.json();
        if (bibleData.data?.mark) {
          copyrightText = bibleData.data.mark;
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch copyright metadata for bible ${bibleId}:`, err);
    }

    // Fetch Timestamps (if available)
    let timestamps = null;
    try {
      const tsUrl = `https://4.dbt.io/api/timestamps/${filesetId}/${book.toUpperCase()}/${chapter}?key=${apiKey}&v=4`;
      const tsRes = await fetch(tsUrl);
      if (tsRes.ok) {
        const tsData = await tsRes.json();
        if (tsData.data && Array.isArray(tsData.data) && tsData.data.length > 0) {
          timestamps = tsData.data.map((item: any) => ({
            verse: Number(item.verse_start),
            timestamp: Number(item.timestamp)
          }));
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch timestamps for ${filesetId}/${book}/${chapter}:`, err);
    }

    // 3. Store in cache
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('audio_chapter_cache')
          .upsert({
            fileset_id: filesetId,
            book: book.toUpperCase(),
            chapter: chapter,
            audio_url: fetchedAudioUrl,
            timestamps: timestamps,
            copyright_text: copyrightText,
            cached_at: new Date().toISOString()
          }, { onConflict: 'fileset_id,book,chapter' });
      } catch (cacheErr: any) {
        console.warn("Failed to write to audio_chapter_cache:", cacheErr.message);
      }
    }

    return res.status(200).json({
      audioUrl: fetchedAudioUrl,
      timestamps,
      copyrightText
    });
  } catch (error: any) {
    console.error('Audio Bible API handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
