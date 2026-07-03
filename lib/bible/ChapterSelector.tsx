import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';

export interface BibleBook {
  code: string;
  name: string;
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { code: 'GEN', name: 'Genesis', chapters: 50 },
  { code: 'EXOD', name: 'Exodus', chapters: 40 },
  { code: 'LEV', name: 'Leviticus', chapters: 27 },
  { code: 'NUM', name: 'Numbers', chapters: 36 },
  { code: 'DEUT', name: 'Deuteronomy', chapters: 34 },
  { code: 'JOSH', name: 'Joshua', chapters: 24 },
  { code: 'JUDG', name: 'Judges', chapters: 21 },
  { code: 'RUTH', name: 'Ruth', chapters: 4 },
  { code: '1SAM', name: '1 Samuel', chapters: 31 },
  { code: '2SAM', name: '2 Samuel', chapters: 24 },
  { code: '1KGS', name: '1 Kings', chapters: 22 },
  { code: '2KGS', name: '2 Kings', chapters: 25 },
  { code: '1CHR', name: '1 Chronicles', chapters: 29 },
  { code: '2CHR', name: '2 Chronicles', chapters: 36 },
  { code: 'EZRA', name: 'Ezra', chapters: 10 },
  { code: 'NEH', name: 'Nehemiah', chapters: 13 },
  { code: 'ESTH', name: 'Esther', chapters: 10 },
  { code: 'JOB', name: 'Job', chapters: 42 },
  { code: 'PSALM', name: 'Psalms', chapters: 150 },
  { code: 'PROV', name: 'Proverbs', chapters: 31 },
  { code: 'ECCL', name: 'Ecclesiastes', chapters: 12 },
  { code: 'SONG', name: 'Song of Solomon', chapters: 8 },
  { code: 'ISA', name: 'Isaiah', chapters: 66 },
  { code: 'JER', name: 'Jeremiah', chapters: 52 },
  { code: 'LAM', name: 'Lamentations', chapters: 5 },
  { code: 'EZEK', name: 'Ezekiel', chapters: 48 },
  { code: 'DAN', name: 'Daniel', chapters: 12 },
  { code: 'HOS', name: 'Hosea', chapters: 14 },
  { code: 'JOEL', name: 'Joel', chapters: 3 },
  { code: 'AMOS', name: 'Amos', chapters: 9 },
  { code: 'OBAD', name: 'Obadiah', chapters: 1 },
  { code: 'JONAH', name: 'Jonah', chapters: 4 },
  { code: 'MIC', name: 'Micah', chapters: 7 },
  { code: 'NAH', name: 'Nahum', chapters: 3 },
  { code: 'HAB', name: 'Habakkuk', chapters: 3 },
  { code: 'ZEPH', name: 'Zephaniah', chapters: 3 },
  { code: 'HAG', name: 'Haggai', chapters: 2 },
  { code: 'ZECH', name: 'Zechariah', chapters: 14 },
  { code: 'MAL', name: 'Malachi', chapters: 4 },
  { code: 'MATT', name: 'Matthew', chapters: 28 },
  { code: 'MARK', name: 'Mark', chapters: 16 },
  { code: 'LUKE', name: 'Luke', chapters: 24 },
  { code: 'JOHN', name: 'John', chapters: 21 },
  { code: 'ACTS', name: 'Acts', chapters: 28 },
  { code: 'ROM', name: 'Romans', chapters: 16 },
  { code: '1COR', name: '1 Corinthians', chapters: 16 },
  { code: '2COR', name: '2 Corinthians', chapters: 13 },
  { code: 'GAL', name: 'Galatians', chapters: 6 },
  { code: 'EPH', name: 'Ephesians', chapters: 6 },
  { code: 'PHIL', name: 'Philippians', chapters: 4 },
  { code: 'COL', name: 'Colossians', chapters: 4 },
  { code: '1THESS', name: '1 Thessalonians', chapters: 5 },
  { code: '2THESS', name: '2 Thessalonians', chapters: 3 },
  { code: '1TIM', name: '1 Timothy', chapters: 6 },
  { code: '2TIM', name: '2 Timothy', chapters: 4 },
  { code: 'TITUS', name: 'Titus', chapters: 3 },
  { code: 'PHILEM', name: 'Philemon', chapters: 1 },
  { code: 'HEB', name: 'Hebrews', chapters: 13 },
  { code: 'JAS', name: 'James', chapters: 5 },
  { code: '1PET', name: '1 Peter', chapters: 5 },
  { code: '2PET', name: '2 Peter', chapters: 3 },
  { code: '1JOHN', name: '1 John', chapters: 5 },
  { code: '2JOHN', name: '2 John', chapters: 1 },
  { code: '3JOHN', name: '3 John', chapters: 1 },
  { code: 'JUDE', name: 'Jude', chapters: 1 },
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
