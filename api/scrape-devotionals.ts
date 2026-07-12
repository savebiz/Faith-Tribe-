import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase credentials are not configured on the server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Verify auth (Vercel Cron header or token)
  const hasCronHeader = !!req.headers['x-vercel-cron'];
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const isAuth = hasCronHeader || token === supabaseServiceKey;

  if (!isAuth && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized call to scrape devotionals' });
  }

  // Parse date query param (default: Lagos time today)
  let dateStr = req.query.date || '';
  let targetDate = new Date();
  if (dateStr) {
    targetDate = new Date(dateStr);
  } else {
    // Offset to Lagos timezone (UTC+1)
    const utc = targetDate.getTime() + (targetDate.getTimezoneOffset() * 60000);
    targetDate = new Date(utc + (3600000 * 1));
  }

  const dateFormatted = targetDate.toISOString().split('T')[0];

  const results: any[] = [];
  const errors: string[] = [];

  const alertAdmin = async (message: string) => {
    console.error(`SCRAPE ALERT: ${message}`);
    // Queue distress escalation in database
    await supabaseAdmin
      .from('escalations')
      .insert([{ message, status: 'queued' }]);

    // Telegram delivery
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        const { data: staffList } = await supabaseAdmin
          .from('staff')
          .select('telegram_chat_id')
          .not('telegram_chat_id', 'is', null);

        if (staffList && staffList.length > 0) {
          for (const member of staffList) {
            if (member.telegram_chat_id) {
              const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${member.telegram_chat_id}&text=${encodeURIComponent(message)}`;
              await fetch(tgUrl);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to send Telegram alert:', err);
      }
    }
  };

  const scrapeJob = async (type: 'open_heavens_teens' | 'open_heavens_general', zone: 'teens' | 'teachers') => {
    const day = targetDate.getDate();
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const month = monthNames[targetDate.getMonth()];
    const year = targetDate.getFullYear();

    // Candidate URL arrays to handle permalink structure changes
    let urls: string[] = [];
    if (type === 'open_heavens_general') {
      urls = [
        `https://rccglive.com/open-heavens-${day}-${month}-${year}-devotional/`,
        `https://rccglive.com/open-heavens-devotional-${day}-${month}-${year}/`,
        `https://rccglive.com/open-heavens-${day}-${month}-${year}/`
      ];
    } else {
      urls = [
        `https://rccglive.com/open-heavens-for-teens-${day}-${month}-${year}-devotional/`,
        `https://rccglive.com/open-heavens-teens-${day}-${month}-${year}/`,
        `https://rccglive.com/open-heavens-for-teens-${day}-${month}-${year}/`
      ];
    }

    let html = '';
    let usedUrl = '';
    
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          html = await res.text();
          usedUrl = url;
          break;
        }
      } catch (e) {
        // continue trying next URL
      }
    }

    if (!html) {
      const err = `Open Heavens scrape failed for ${type} on ${dateFormatted}: URLs tried: ${urls.join(', ')}`;
      errors.push(err);
      await alertAdmin(err);
      return;
    }

    try {
      const $ = cheerio.load(html);
      
      const title = $('h1.entry-title').text().trim() || $('h1').first().text().trim() || `Open Heavens - ${dateFormatted}`;
      
      const paragraphs: string[] = [];
      $('.entry-content p, article p, .post-content p').each((_, el) => {
        paragraphs.push($(el).text().trim());
      });

      if (paragraphs.length === 0) {
        throw new Error('No paragraphs extracted from the entry content.');
      }

      // Parse fields out of extracted text blocks
      let memoryVerse = '';
      let memoryVerseRef = '';
      let bibleReadingRef = '';
      let prayerPoint = '';
      const bodyParas: string[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i];
        const upperText = text.toUpperCase();

        if (upperText.startsWith('MEMORISE:') || upperText.startsWith('MEMORIZE:') || upperText.includes('MEMORY VERSE:')) {
          memoryVerse = text.replace(/^(memorise|memorize|memory\s+verse):/i, '').trim();
          if (i + 1 < paragraphs.length && paragraphs[i+1].length < 60 && /^[123]?\s*[A-Z][a-z]+/.test(paragraphs[i+1])) {
            memoryVerseRef = paragraphs[i+1];
            i++;
          }
          continue;
        }

        if (upperText.startsWith('BIBLE READING:') || upperText.startsWith('READ:')) {
          bibleReadingRef = text.replace(/^(bible\s+reading|read):/i, '').trim();
          continue;
        }

        if (upperText.startsWith('PRAYER POINT:') || upperText.startsWith('PRAYER POINTS:') || upperText.includes('PRAYER:')) {
          prayerPoint = text.replace(/^(prayer\s+points?|prayer):/i, '').trim();
          continue;
        }

        if (!text || text.includes('Share this:') || text.startsWith('Click HERE') || text.includes('Also Read:')) {
          continue;
        }

        bodyParas.push(text);
      }

      const bodyContent = bodyParas.join('\n\n');

      if (!bodyContent) {
        throw new Error('Parsed teaching body content is empty.');
      }

      const devotionalObj = {
        devotional_type: type,
        zone,
        devotional_date: dateFormatted,
        title,
        memory_verse: memoryVerse || null,
        memory_verse_ref: memoryVerseRef || null,
        bible_reading_ref: bibleReadingRef || null,
        body_content: bodyContent,
        prayer_point: prayerPoint || null,
        source_url: usedUrl,
        status: 'draft'
      };

      const { error: upsertErr } = await supabaseAdmin
        .from('devotionals')
        .upsert(devotionalObj, { onConflict: 'devotional_type,devotional_date' });

      if (upsertErr) throw upsertErr;

      results.push({ type, date: dateFormatted, status: 'scraped_and_upserted_as_draft' });
    } catch (err: any) {
      const msg = `Open Heavens parsing failed for ${type} on ${dateFormatted}: ${err.message || err}`;
      errors.push(msg);
      await alertAdmin(msg);
    }
  };

  await scrapeJob('open_heavens_teens', 'teens');
  await scrapeJob('open_heavens_general', 'teachers');

  return res.status(200).json({
    success: errors.length === 0,
    date: dateFormatted,
    results,
    errors
  });
}
