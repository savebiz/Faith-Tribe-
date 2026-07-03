import React, { useState, useEffect } from 'react';
import { BibleTextView } from '@youversion/platform-react-ui';
import { useVerseOfTheDay } from '@youversion/platform-react-hooks';
import { fetchCustomVerse } from '../supabase';

const BOOK_NAMES: Record<string, string> = {
  GEN: 'Genesis', EXOD: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEUT: 'Deuteronomy',
  JOSH: 'Joshua', JUDG: 'Judges', RUTH: 'Ruth', '1SAM': '1 Samuel', '2SAM': '2 Samuel',
  '1KGS': '1 Kings', '2KGS': '2 Kings', '1CHR': '1 Chronicles', '2CHR': '2 Chronicles',
  EZRA: 'Ezra', NEH: 'Nehemiah', ESTH: 'Esther', JOB: 'Job', PSALM: 'Psalms',
  PROV: 'Proverbs', ECCL: 'Ecclesiastes', SONG: 'Song of Solomon', ISA: 'Isaiah',
  JER: 'Jeremiah', LAM: 'Lamentations', EZEK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOEL: 'Joel', AMOS: 'Amos', OBAD: 'Obadiah', JONAH: 'Jonah', MIC: 'Micah',
  NAH: 'Nahum', HAB: 'Habakkuk', ZEPH: 'Zephaniah', HAG: 'Haggai', ZECH: 'Zechariah',
  MAL: 'Malachi', MATT: 'Matthew', MARK: 'Mark', LUKE: 'Luke', JOHN: 'John',
  ACTS: 'Acts', ROM: 'Romans', '1COR': '1 Corinthians', '2COR': '2 Corinthians',
  GAL: 'Galatians', EPH: 'Ephesians', PHIL: 'Philippians', COL: 'Colossians',
  '1THESS': '1 Thessalonians', '2THESS': '2 Thessalonians', '1TIM': '1 Timothy',
  '2TIM': '2 Timothy', TITUS: 'Titus', PHILEM: 'Philemon', HEB: 'Hebrews',
  JAS: 'James', '1PET': '1 Peter', '2PET': '2 Player', '1JOHN': '1 John',
  '2JOHN': '2 John', '3JOHN': '3 John', JUDE: 'Jude', REV: 'Revelation'
};

function getMondayDayOfYear(): number {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const start = new Date(monday.getFullYear(), 0, 0);
  const diffMs = monday.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000);
}

export function VerseOfTheWeek({ versionId }: { versionId: number }) {
  const dayOfYear = getMondayDayOfYear();
  const { data: votd, loading: votdLoading, error: votdError } = useVerseOfTheDay(dayOfYear);
  
  const [customVerse, setCustomVerse] = useState<string | null>(null);
  const [isCustomLoading, setIsCustomLoading] = useState(true);

  useEffect(() => {
    const loadCustom = async () => {
      try {
        const verse = await fetchCustomVerse();
        setCustomVerse(verse);
      } catch (e) {
        console.warn("Failed to load custom verse override:", e);
      } finally {
        setIsCustomLoading(false);
      }
    };
    loadCustom();
  }, []);

  const navigateToBible = (book: string, chapter: string) => {
    const path = `/bible/${book}/${chapter}?version=${versionId}`;
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getDisplayReference = (passageId: string) => {
    const parts = passageId.split('.');
    if (parts.length >= 3) {
      const bookCode = parts[0].toUpperCase();
      const bookName = BOOK_NAMES[bookCode] || bookCode;
      const chapter = parts[1];
      const verse = parts[2];
      return `${bookName} ${chapter}:${verse}`;
    }
    return passageId;
  };

  const handleCardClick = (passageId: string) => {
    const parts = passageId.split('.');
    if (parts.length >= 2) {
      navigateToBible(parts[0], parts[1]);
    }
  };

  const handleFallbackClick = () => {
    navigateToBible('PSA', '119');
  };

  const activeLoading = votdLoading || isCustomLoading;
  const activePassage = customVerse || votd?.passage_id;

  if (activeLoading) {
    return (
      <div className="animate-pulse space-y-2 py-4">
        <div className="h-4 bg-[#372f58]/10 rounded w-3/4"></div>
        <div className="h-3 bg-[#372f58]/10 rounded w-1/2"></div>
      </div>
    );
  }

  if (votdError && !customVerse) {
    return (
      <div 
        onClick={handleFallbackClick}
        className="text-xs text-gray-500 py-2 italic text-center cursor-pointer hover:text-[#1CABB9] transition-colors"
        title="Click to read Psalm 119 in Bible"
      >
        Thy Word is a lamp unto my feet and a light unto my path. (Psalm 119:105)
      </div>
    );
  }

  if (!activePassage) {
    return (
      <div 
        onClick={handleFallbackClick}
        className="text-xs text-gray-500 py-2 italic text-center cursor-pointer hover:text-[#1CABB9] transition-colors"
        title="Click to read Psalm 119 in Bible"
      >
        Thy Word is a lamp unto my feet and a light unto my path. (Psalm 119:105)
      </div>
    );
  }

  return (
    <div 
      onClick={() => handleCardClick(activePassage)}
      className="space-y-1 cursor-pointer hover:opacity-90 transition-opacity p-2 -m-2 rounded-2xl group"
      title="Click to read full chapter in Bible"
    >
      <div className="relative">
        <BibleTextView reference={activePassage} versionId={versionId} />
        <div className="mt-2.5 text-xs font-black text-[#1CABB9] select-none tracking-wider">
          — {getDisplayReference(activePassage)}
        </div>
        <div className="mt-4 text-xs font-black text-[#372f58] group-hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 select-none">
          <span>Read full chapter &rarr;</span>
        </div>
      </div>
    </div>
  );
}
