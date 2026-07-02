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
      <div className="text-xs text-gray-500 py-2 italic text-center">
        Thy Word is a lamp unto my feet and a light unto my path. (Psalm 119:105)
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <BibleTextView reference={votd.passage_id} versionId={versionId} />
    </div>
  );
}
