import React, { useState, useEffect } from 'react';
import { BibleTextView } from '@youversion/platform-react-ui';
import { useVerseOfTheDay } from '@youversion/platform-react-hooks';
import { fetchCustomVerse, fetchVotdOverrides, fetchStudyNotesForChapter, BibleStudyNote } from '../supabase';
import { BOOK_NAMES } from './bookCodes';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';
import { StudyNote } from '../../components/StudyNote';

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const navigateToBible = (book: string, chapter: string, verse?: string) => {
    const activeVersionId = overrideVersionId || versionId;
    let path = `/bible/${book}/${chapter}?version=${activeVersionId}`;
    if (verse) {
      path += `&verse=${verse}`;
    }
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
    if (parts.length >= 3) {
      navigateToBible(parts[0], parts[1], parts[2]);
    } else if (parts.length >= 2) {
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

  // Parse activePassage (e.g. "PRO.19.17" or "ROM.12.1-2") to individual verses
  const activeVerses: string[] = [];
  const parts = activePassage.split('.');
  if (parts.length >= 3) {
    const versePart = parts[2];
    if (versePart.includes('-')) {
      const [startStr, endStr] = versePart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let v = start; v <= end; v++) {
          activeVerses.push(v.toString());
        }
      }
    } else {
      activeVerses.push(versePart);
    }
  }

  // Filter notes based on specific verse
  const filteredNotes = studyNotes.filter(note => {
    // 1. Filter by specific verse
    if (!note.usfm_start) return false;
    const noteRefParts = note.usfm_start.split(' '); // e.g. ["PRO", "19:17"]
    if (noteRefParts.length >= 2) {
      const chapterVerse = noteRefParts[1]; // "19:17"
      const cvParts = chapterVerse.split(':');
      if (cvParts.length >= 2) {
        const noteVerse = cvParts[1]; // "17"
        
        // If noteVerse is a range like "17-18", check overlap
        if (noteVerse.includes('-')) {
          const [sStr, eStr] = noteVerse.split('-');
          const s = parseInt(sStr, 10);
          const e = parseInt(eStr, 10);
          if (!isNaN(s) && !isNaN(e)) {
            for (let v = s; v <= e; v++) {
              if (activeVerses.includes(v.toString())) return true;
            }
          }
        }
        
        return activeVerses.includes(noteVerse);
      }
    }
    return false;
  });

  return (
    <div className="space-y-4">
      <div 
        onClick={() => handleCardClick(activePassage)}
        className="space-y-1 cursor-pointer hover:opacity-90 transition-opacity p-2 -m-2 rounded-2xl group text-left"
        title="Click to read specific verse in Bible"
      >
        <div className="relative">
          <BibleTextView reference={activePassage} versionId={overrideVersionId || versionId} />
          <div className="mt-2.5 text-xs font-black text-[#1CABB9] select-none tracking-wider">
            — {getDisplayReference(activePassage)}
          </div>
          <div className="mt-4 text-xs font-black text-[#372f58] transition-colors flex items-center justify-between select-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const pathParts = activePassage.split('.');
                if (pathParts.length >= 2) {
                  navigateToBible(pathParts[0], pathParts[1]); // Navigate to chapter (no verse param)
                }
              }}
              className="text-[#372f58] hover:text-[#1CABB9] transition-colors font-bold text-xs cursor-pointer bg-transparent border-0 p-0 flex items-center outline-none"
            >
              Read full chapter &rarr;
            </button>
            {showStudyNotes && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <BookOpen size={12} className="text-emerald-500" />
                <span>{isExpanded ? 'Hide Insights' : 'Study Insights'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showStudyNotes && isExpanded && (
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
                <div key={index} className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-200/60 shadow-inner text-sm text-gray-700 leading-relaxed text-left">
                  <h5 className="font-extrabold text-gray-900 mb-2 text-sm">{note.title}</h5>
                  <StudyNote 
                    contentHtml={note.content_html} 
                    currentVersionId={overrideVersionId || versionId}
                    showAttribution={false}
                    onNavigateToPassage={(newBook, newChapter, _, newVerse) => {
                      navigateToBible(newBook, newChapter, newVerse);
                    }}
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
