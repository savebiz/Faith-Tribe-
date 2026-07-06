import React, { useState, useEffect } from 'react';
import { BibleTextView } from '@youversion/platform-react-ui';
import { useVerseOfTheDay } from '@youversion/platform-react-hooks';
import { fetchCustomVerse, fetchVotdOverrides, fetchStudyNotesForChapter, BibleStudyNote } from '../supabase';
import { BOOK_NAMES } from './bookCodes';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000);
}

export function VerseOfTheWeek({ versionId, showStudyNotes = false }: { versionId: number; showStudyNotes?: boolean }) {
  const dayOfYear = getDayOfYear();
  const { data: votd, loading: votdLoading, error: votdError } = useVerseOfTheDay(dayOfYear);
  
  const [customVerse, setCustomVerse] = useState<string | null>(null);
  const [overrideVersionId, setOverrideVersionId] = useState<number | null>(null);
  const [isCustomLoading, setIsCustomLoading] = useState(true);

  // Study Notes states
  const [studyNotes, setStudyNotes] = useState<BibleStudyNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [goDeeper, setGoDeeper] = useState(false);

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

  const activePassage = customVerse || votd?.passage_id;

  useEffect(() => {
    if (!showStudyNotes || !activePassage) return;
    
    const loadNotes = async () => {
      try {
        setNotesLoading(true);
        const parts = activePassage.split('.');
        if (parts.length >= 2) {
          const book = parts[0];
          const chapter = parts[1];
          const data = await fetchStudyNotesForChapter(book, chapter);
          setStudyNotes(data);
        }
      } catch (err) {
        console.warn("Failed to load study notes for verse:", err);
      } finally {
        setNotesLoading(false);
      }
    };
    loadNotes();
  }, [activePassage, showStudyNotes]);

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

  const activeLoading = votdLoading || isCustomLoading;

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
        onClick={() => navigateToBible('PSA', '119')}
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
        onClick={() => navigateToBible('PSA', '119')}
        className="text-xs text-gray-500 py-2 italic text-center cursor-pointer hover:text-[#1CABB9] transition-colors"
        title="Click to read Psalm 119 in Bible"
      >
        Thy Word is a lamp unto my feet and a light unto my path. (Psalm 119:105)
      </div>
    );
  }

  // Filter notes based on toggle
  const filteredNotes = studyNotes.filter(note => {
    const noteTier = note.tier || 'basic';
    return goDeeper ? noteTier === 'advanced' : noteTier === 'basic';
  });

  return (
    <div className="space-y-4">
      <div 
        onClick={() => handleCardClick(activePassage)}
        className="space-y-1 cursor-pointer hover:opacity-90 transition-opacity p-2 -m-2 rounded-2xl group text-left"
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

      {showStudyNotes && (
        <div className="mt-6 pt-6 border-t border-gray-150 text-left font-sans">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={16} className="text-emerald-500" />
              <span>Study Insights</span>
            </h4>
            
            {/* Go Deeper Toggle */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setGoDeeper(false)}
                className={`px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                  !goDeeper ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Basic Note
              </button>
              <button
                type="button"
                onClick={() => {
                  const flagEnabled = import.meta.env.VITE_ENABLE_AQUIFER_TEENS === 'true';
                  if (flagEnabled) {
                    setGoDeeper(true);
                  } else {
                    toast.info('Go Deeper Mode (unmodified Aquifer study logs) is coming soon! 📚');
                  }
                }}
                className={`px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  goDeeper ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>Go Deeper</span>
                {import.meta.env.VITE_ENABLE_AQUIFER_TEENS !== 'true' && (
                  <span className="text-[8px] bg-amber-500 text-white px-1.5 rounded-full font-black scale-90">SOON</span>
                )}
              </button>
            </div>
          </div>

          {notesLoading ? (
            <div className="animate-pulse space-y-2 py-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 text-center">
              <p className="text-xs text-gray-500 italic">No {goDeeper ? 'advanced' : 'basic'} study notes available for this passage yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note, index) => (
                <div key={index} className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-200/60 shadow-inner text-sm text-gray-700 leading-relaxed">
                  <h5 className="font-extrabold text-gray-900 mb-2 text-sm">{note.title}</h5>
                  <div 
                    className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-gray-900"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content_html) }} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
