import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';

export interface BibleBook {
  code: string;
  name: string;
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { code: 'GEN', name: 'Genesis', chapters: 50 },
  { code: 'EXO', name: 'Exodus', chapters: 40 },
  { code: 'LEV', name: 'Leviticus', chapters: 27 },
  { code: 'NUM', name: 'Numbers', chapters: 36 },
  { code: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { code: 'JOS', name: 'Joshua', chapters: 24 },
  { code: 'JDG', name: 'Judges', chapters: 21 },
  { code: 'RUT', name: 'Ruth', chapters: 4 },
  { code: '1SA', name: '1 Samuel', chapters: 31 },
  { code: '2SA', name: '2 Samuel', chapters: 24 },
  { code: '1KI', name: '1 Kings', chapters: 22 },
  { code: '2KI', name: '2 Kings', chapters: 25 },
  { code: '1CH', name: '1 Chronicles', chapters: 29 },
  { code: '2CH', name: '2 Chronicles', chapters: 36 },
  { code: 'EZR', name: 'Ezra', chapters: 10 },
  { code: 'NEH', name: 'Nehemiah', chapters: 13 },
  { code: 'EST', name: 'Esther', chapters: 10 },
  { code: 'JOB', name: 'Job', chapters: 42 },
  { code: 'PSA', name: 'Psalms', chapters: 150 },
  { code: 'PRO', name: 'Proverbs', chapters: 31 },
  { code: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { code: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { code: 'ISA', name: 'Isaiah', chapters: 66 },
  { code: 'JER', name: 'Jeremiah', chapters: 52 },
  { code: 'LAM', name: 'Lamentations', chapters: 5 },
  { code: 'EZK', name: 'Ezekiel', chapters: 48 },
  { code: 'DAN', name: 'Daniel', chapters: 12 },
  { code: 'HOS', name: 'Hosea', chapters: 14 },
  { code: 'JOL', name: 'Joel', chapters: 3 },
  { code: 'AMO', name: 'Amos', chapters: 9 },
  { code: 'OBA', name: 'Obadiah', chapters: 1 },
  { code: 'JON', name: 'Jonah', chapters: 4 },
  { code: 'MIC', name: 'Micah', chapters: 7 },
  { code: 'NAM', name: 'Nahum', chapters: 3 },
  { code: 'HAB', name: 'Habakkuk', chapters: 3 },
  { code: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { code: 'HAG', name: 'Haggai', chapters: 2 },
  { code: 'ZEC', name: 'Zechariah', chapters: 14 },
  { code: 'MAL', name: 'Malachi', chapters: 4 },
  { code: 'MAT', name: 'Matthew', chapters: 28 },
  { code: 'MRK', name: 'Mark', chapters: 16 },
  { code: 'LUK', name: 'Luke', chapters: 24 },
  { code: 'JHN', name: 'John', chapters: 21 },
  { code: 'ACT', name: 'Acts', chapters: 28 },
  { code: 'ROM', name: 'Romans', chapters: 16 },
  { code: '1CO', name: '1 Corinthians', chapters: 16 },
  { code: '2CO', name: '2 Corinthians', chapters: 13 },
  { code: 'GAL', name: 'Galatians', chapters: 6 },
  { code: 'EPH', name: 'Ephesians', chapters: 6 },
  { code: 'PHP', name: 'Philippians', chapters: 4 },
  { code: 'COL', name: 'Colossians', chapters: 4 },
  { code: '1TH', name: '1 Thessalonians', chapters: 5 },
  { code: '2TH', name: '2 Thessalonians', chapters: 3 },
  { code: '1TI', name: '1 Timothy', chapters: 6 },
  { code: '2TI', name: '2 Timothy', chapters: 4 },
  { code: 'TIT', name: 'Titus', chapters: 3 },
  { code: 'PHM', name: 'Philemon', chapters: 1 },
  { code: 'HEB', name: 'Hebrews', chapters: 13 },
  { code: 'JAS', name: 'James', chapters: 5 },
  { code: '1PE', name: '1 Peter', chapters: 5 },
  { code: '2PE', name: '2 Peter', chapters: 3 },
  { code: '1JN', name: '1 John', chapters: 5 },
  { code: '2JN', name: '2 John', chapters: 1 },
  { code: '3JN', name: '3 John', chapters: 1 },
  { code: 'JUD', name: 'Jude', chapters: 1 },
  { code: 'REV', name: 'Revelation', chapters: 22 },
];

export interface ChapterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: string; // e.g. 'GEN'
  currentChapter: string; // e.g. '1'
  onSelect: (bookCode: string, chapterNum: string) => void;
  isKidsMode: boolean;
}

export function ChapterSelector({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  onSelect,
  isKidsMode,
}: ChapterSelectorProps) {
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);

  // Initialize selectedBook based on currentBook prop
  useEffect(() => {
    if (isOpen && currentBook) {
      const bookObj = BIBLE_BOOKS.find((b) => b.code === currentBook);
      if (bookObj) {
        setSelectedBook(bookObj);
      }
    }
  }, [isOpen, currentBook]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 bg-gray-900/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300">
      {/* Background overlay click handler */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Bottom Sheet Card */}
      <div 
        className={`relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in slide-in-from-bottom duration-300 transition-all ${
          isKidsMode ? 'pb-8 pt-6' : 'pb-6 pt-5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {selectedBook && (
              <button
                onClick={() => setSelectedBook(null)}
                className={`flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer ${
                  isKidsMode ? 'w-10 h-10' : 'w-8 h-8'
                }`}
                title="Back to Books"
              >
                <ChevronLeft size={isKidsMode ? 20 : 16} />
              </button>
            )}
            <h3 className={`font-black text-[#372f58] ${isKidsMode ? 'text-xl' : 'text-base'}`}>
              {selectedBook ? `Select Chapter (${selectedBook.name})` : 'Select Bible Book'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
            aria-label="Close selector"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Selector Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {!selectedBook ? (
            /* View A: Books List */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BIBLE_BOOKS.map((bk) => {
                const isCurrent = bk.code === currentBook;
                return (
                  <button
                    key={bk.code}
                    onClick={() => setSelectedBook(bk)}
                    className={`text-left px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border flex items-center justify-between group ${
                      isCurrent
                        ? isKidsMode
                          ? 'bg-[#1CABB9] border-[#1CABB9] text-white shadow-md shadow-[#1CABB9]/20'
                          : 'bg-[#372f58] border-[#372f58] text-white'
                        : 'bg-white border-gray-150 text-[#372f58] hover:border-[#1CABB9]/40 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-1">{bk.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isCurrent 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}>
                      {bk.chapters}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* View B: Chapters Grid */
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3.5">
              {Array.from({ length: selectedBook.chapters }, (_, i) => {
                const chapterNum = String(i + 1);
                const isSelected = selectedBook.code === currentBook && chapterNum === currentChapter;

                return (
                  <button
                    key={chapterNum}
                    onClick={() => {
                      onSelect(selectedBook.code, chapterNum);
                      onClose();
                    }}
                    style={{
                      minWidth: isKidsMode ? '48px' : '44px',
                      minHeight: isKidsMode ? '48px' : '44px',
                    }}
                    className={`flex items-center justify-center font-black text-sm transition-all cursor-pointer border shadow-sm ${
                      isKidsMode 
                        ? 'rounded-md text-[15px]' 
                        : 'rounded-xl'
                    } ${
                      isSelected
                        ? isKidsMode
                          ? 'bg-[#1CABB9] border-[#1CABB9] text-white font-extrabold scale-110 shadow-lg shadow-[#1CABB9]/30'
                          : 'bg-[#372f58] border-[#372f58] text-white scale-105'
                        : isKidsMode
                          ? 'bg-gray-100 border-gray-200 text-[#372f58] hover:bg-[#1CABB9]/10 hover:border-[#1CABB9]'
                          : 'bg-white border-gray-150 text-[#372f58] hover:border-[#1CABB9] hover:text-[#1CABB9]'
                    }`}
                  >
                    {chapterNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
