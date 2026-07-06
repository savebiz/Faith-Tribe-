import React, { useState, useEffect } from 'react';
import { BibleTextView } from '@youversion/platform-react-ui';
import { useVerseOfTheDay } from '@youversion/platform-react-hooks';
import { fetchCustomVerse, fetchVotdOverrides } from '../supabase';
import { BOOK_NAMES } from './bookCodes';

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000);
}

export function VerseOfTheWeek({ versionId }: { versionId: number }) {
  const dayOfYear = getDayOfYear();
  const { data: votd, loading: votdLoading, error: votdError } = useVerseOfTheDay(dayOfYear);
  
  const [customVerse, setCustomVerse] = useState<string | null>(null);
  const [overrideVersionId, setOverrideVersionId] = useState<number | null>(null);
  const [isCustomLoading, setIsCustomLoading] = useState(true);

  useEffect(() => {
    const loadCustom = async () => {
      try {
        const zone = localStorage.getItem('ft_current_zone') || 'kids';
        const todayStr = new Date().toISOString().split('T')[0];
        const overrides = await fetchVotdOverrides(zone as any);
        const match = overrides.find(o => o.override_date === todayStr);
        
        if (match) {
          setCustomVerse(match.reference);
          setOverrideVersionId(match.version_id);
          setIsCustomLoading(false);
          return;
        }

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
    const activeVersionId = overrideVersionId || versionId;
    const path = `/bible/${book}/${chapter}?version=${activeVersionId}`;
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
        <BibleTextView reference={activePassage} versionId={overrideVersionId || versionId} />
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
