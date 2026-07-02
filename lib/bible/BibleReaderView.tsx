import React, { useState } from 'react';
import { BibleReader } from '@youversion/platform-react-ui';
import { ArrowLeft, Book } from 'lucide-react';

const APPROVED_VERSIONS = [
  { id: 3034, label: 'Berean Standard Bible (BSB)' },
  { id: 1932, label: 'Free Bible Version (FBV)' },
  { id: 1588, label: 'Amplified Bible (AMP)' },
  { id: 1, label: 'King James Version (KJV)' },
  { id: 111, label: 'New International Version (NIV)' },
];

export function BibleReaderView({ onBack }: { onBack: () => void }) {
  const [book, setBook] = useState('GEN');
  const [chapter, setChapter] = useState('1');
  const [versionId, setVersionId] = useState(() => {
    const saved = localStorage.getItem('yv_version_id');
    return saved ? Number(saved) : 3034; // BSB as general default
  });

  const handleVersionChange = (id: number) => {
    setVersionId(id);
    localStorage.setItem('yv_version_id', String(id));
  };

  return (
    <div className="min-h-screen mesh-gradient py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/50 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-[#372f58] hover:text-[#1CABB9] transition-colors cursor-pointer self-start"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#372f58]/10 flex items-center justify-center text-[#372f58]">
              <Book size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#372f58]">Holy Bible</h1>
              <p className="text-xs text-gray-500">Read & study God's Word</p>
            </div>
          </div>
        </div>

        {/* Custom Version Selector */}
        <div className="flex flex-col gap-2 mb-6">
          <label htmlFor="version-select" className="text-xs font-bold text-[#372f58]/80 uppercase tracking-wider">
            Translation
          </label>
          <div className="relative max-w-xs">
            <select
              id="version-select"
              value={versionId}
              onChange={(e) => handleVersionChange(Number(e.target.value))}
              className="w-full bg-white/80 border border-gray-200 text-[#372f58] font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1CABB9] cursor-pointer appearance-none"
            >
              {APPROVED_VERSIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#372f58]/60">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* YouVersion Bible Reader */}
        <div className="yv-reader-wrapper border border-gray-100 rounded-2xl p-4 sm:p-6 bg-white/50 shadow-inner">
          <BibleReader.Root
            book={book}
            onBookChange={setBook}
            chapter={chapter}
            onChapterChange={setChapter}
            versionId={versionId}
            onVersionChange={handleVersionChange}
          >
            <BibleReader.Content />
            <div className="mt-6 pt-4 border-t border-gray-100">
              <BibleReader.Toolbar />
            </div>
          </BibleReader.Root>
        </div>
      </div>
    </div>
  );
}
