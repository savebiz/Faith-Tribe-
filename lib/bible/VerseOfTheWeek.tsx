import React from 'react';
import { BibleTextView } from '@youversion/platform-react-ui';
import { useVerseOfTheDay } from '@youversion/platform-react-hooks';

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
  const { data: votd, loading, error } = useVerseOfTheDay(dayOfYear);

  const navigateToBible = (book: string, chapter: string) => {
    const path = `/bible/${book}/${chapter}?version=${versionId}`;
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleCardClick = () => {
    if (!votd?.passage_id) return;
    const parts = votd.passage_id.split('.');
    if (parts.length >= 2) {
      navigateToBible(parts[0], parts[1]);
    }
  };

  const handleFallbackClick = () => {
    navigateToBible('PSA', '119');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2 py-4">
        <div className="h-4 bg-[#372f58]/10 rounded w-3/4"></div>
        <div className="h-3 bg-[#372f58]/10 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !votd?.passage_id) {
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
      onClick={handleCardClick}
      className="space-y-1 cursor-pointer hover:opacity-90 transition-opacity p-2 -m-2 rounded-2xl group"
      title="Click to read full chapter in Bible"
    >
      <div className="relative">
        <BibleTextView reference={votd.passage_id} versionId={versionId} />
        <div className="mt-4 text-xs font-black text-[#372f58] group-hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 select-none">
          <span>Read full chapter &rarr;</span>
        </div>
      </div>
    </div>
  );
}
