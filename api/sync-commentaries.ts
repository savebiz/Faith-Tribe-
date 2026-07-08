import { createClient } from '@supabase/supabase-js';

// USFM Book codes lookup map
const USFM_BOOKS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
  'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
  'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
  '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.AQUIFER_API_KEY || '9e4319482ee74e20bfd3341853611737'; // Fallback to user key for verification

  const hasCronHeader = !!req.headers['x-vercel-cron'];
  const reqApiKey = req.headers['x-api-key'] || req.query.key;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  let isAuth = hasCronHeader || reqApiKey === apiKey || token === apiKey;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase credentials are not configured on the server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Verify if it is a logged in staff member
  if (!isAuth && token) {
    try {
      const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (!userErr && user) {
        const { data: staff } = await supabaseAdmin
          .from('staff')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (staff && ['super_admin', 'admin', 'editor'].includes(staff.role)) {
          isAuth = true;
        }
      }
    } catch (err) {
      console.warn('Supabase token verification failed:', err);
    }
  }

  if (!isAuth && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized call to HelloAO commentary sync handler' });
  }

  const backfillBook = req.query.backfillBook ? String(req.query.backfillBook).toUpperCase() : '';
  const chosenCommentary = req.query.commentary ? String(req.query.commentary) : 'matthew-henry';

  try {
    // 1. Fetch available commentaries list from HelloAO
    const commsRes = await fetch('https://bible.helloao.org/api/available_commentaries.json');
    if (!commsRes.ok) {
      return res.status(500).json({ error: `Failed to fetch commentaries list: ${commsRes.status}` });
    }
    const commsData = await commsRes.json();
    const availableComms = commsData.commentaries || [];

    const targetComm = availableComms.find((c: any) => c.id === chosenCommentary);
    if (!targetComm) {
      return res.status(400).json({ 
        error: `Requested commentary "${chosenCommentary}" not found.`,
        available: availableComms.map((c: any) => c.id)
      });
    }

    // 2. Fetch list of books for this commentary
    const booksLink = `https://bible.helloao.org${targetComm.listOfBooksApiLink}`;
    const booksRes = await fetch(booksLink);
    if (!booksRes.ok) {
      return res.status(500).json({ error: `Failed to fetch books list: ${booksRes.status}` });
    }
    const booksData = await booksRes.json();
    let booksToSync = booksData.books || [];

    // If backfilling a specific book, filter list
    if (backfillBook) {
      booksToSync = booksToSync.filter((b: any) => b.id.toUpperCase() === backfillBook);
      if (booksToSync.length === 0) {
        return res.status(404).json({ error: `Book ${backfillBook} is not supported in ${chosenCommentary}` });
      }
    } else {
      // For general sync, limit default sync scope to Matthew only to prevent Vercel Serverless Function 10s timeout
      booksToSync = booksToSync.filter((b: any) => b.id.toUpperCase() === 'MAT');
    }

    let totalIngested = 0;
    const errors = [];

    // 3. Sync books
    for (const book of booksToSync) {
      for (let chapter = 1; chapter <= book.numberOfChapters; chapter++) {
        try {
          const chapterUrl = `https://bible.helloao.org/api/c/${targetComm.id}/${book.id}/${chapter}.json`;
          const chapterRes = await fetch(chapterUrl);
          if (!chapterRes.ok) {
            continue; // Skip if chapter commentary does not exist
          }
          const chapterData = await chapterRes.json();
          
          // Assemble clean HTML content from HelloAO JSON structure
          let htmlContent = '';
          if (chapterData.chapter?.introduction) {
            htmlContent += `<div class="commentary-intro mb-6 pb-4 border-b border-gray-150"><h4 class="text-sm font-black text-[#372f58] uppercase tracking-wider mb-2">Introduction</h4><p class="text-xs text-gray-500 leading-relaxed">${chapterData.chapter.introduction.replace(/\n/g, '<br/>')}</p></div>`;
          }

          if (Array.isArray(chapterData.chapter?.content)) {
            for (const item of chapterData.chapter.content) {
              if (item.type === 'verse' && Array.isArray(item.content)) {
                htmlContent += `<div class="commentary-verse mb-6" data-verse="${item.number}">`;
                htmlContent += `<h5 class="text-xs font-black text-teal-600 uppercase tracking-wider mb-2">Verse ${item.number}</h5>`;
                for (const paragraph of item.content) {
                  if (typeof paragraph === 'string') {
                    htmlContent += `<p class="text-xs font-medium text-gray-700 leading-relaxed mb-3">${paragraph.replace(/\n/g, '<br/>')}</p>`;
                  }
                }
                htmlContent += `</div>`;
              }
            }
          }

          if (!htmlContent) continue;

          // Upsert commentary to Supabase
          const { error } = await supabaseAdmin.from('bible_commentaries').upsert({
            commentary_id: targetComm.id,
            commentary_name: targetComm.englishName,
            license_url: targetComm.licenseUrl,
            book: book.id,
            chapter,
            content: htmlContent,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'commentary_id,book,chapter' });

          if (error) {
            errors.push(`DB error book ${book.id} chapter ${chapter}: ${error.message}`);
          } else {
            totalIngested++;
          }
        } catch (e: any) {
          errors.push(`Network error book ${book.id} chapter ${chapter}: ${e.message}`);
        }
      }
      // Pacing delay between books to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return res.status(200).json({
      success: true,
      commentary: targetComm.id,
      mode: backfillBook ? 'backfill' : 'cron_default',
      totalIngested,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}
