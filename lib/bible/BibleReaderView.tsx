import React, { useState, useEffect, useRef } from 'react';
import { BibleReader } from '@youversion/platform-react-ui';
import { ArrowLeft, Book, Flame, Share2, MoreVertical, Copy, AlertTriangle, Check, Award, Download, Highlighter, Trash2 } from 'lucide-react';
import { fetchReactionCount, incrementReactionCount, hasReacted } from '../supabase';

const APPROVED_VERSIONS = [
  { id: 3034, label: 'Berean Standard Bible (BSB)' },
  { id: 1932, label: 'Free Bible Version (FBV)' },
  { id: 1588, label: 'Amplified Bible (AMP)' },
  { id: 111, label: 'New International Version (NIV)' },
  { id: 1, label: 'King James Version (KJV)' },
  // The three below must always render last, in this exact order
  { id: 911, label: 'Yoruba Contemporary Bible' },
  { id: 1624, label: 'Igbo Contemporary Bible 2020' },
  { id: 1614, label: 'Hausa Contemporary Bible 2020' },
];

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
  JAS: 'James', '1PET': '1 Peter', '2PET': '2 Peter', '1JOHN': '1 John',
  '2JOHN': '2 John', '3JOHN': '3 John', JUDE: 'Jude', REV: 'Revelation'
};

export function BibleReaderView({ onBack }: { onBack: () => void }) {
  // 1. Read initial values from URL path and search params
  const getUrlParams = () => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const versionParam = searchParams.get('version');
    const versionId = versionParam ? Number(versionParam) : null;

    const match = path.match(/^\/bible\/([A-Za-z0-9]+)\/([0-9]+)/);
    const book = match ? match[1].toUpperCase() : 'GEN';
    const chapter = match ? match[2] : '1';
    
    const savedVersion = localStorage.getItem('yv_version_id');
    const defaultVersion = savedVersion ? Number(savedVersion) : 3034;

    return {
      book,
      chapter,
      versionId: versionId || defaultVersion,
    };
  };

  const initial = getUrlParams();
  const [book, setBook] = useState(initial.book);
  const [chapter, setChapter] = useState(initial.chapter);
  const [versionId, setVersionId] = useState(initial.versionId);
  const [isBottomPickerOpen, setIsBottomPickerOpen] = useState(false);

  // Selection and Highlight Layer
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Engagement Layer States
  const [reactionsCount, setReactionsCount] = useState(0);
  const [hasUserReacted, setHasUserReacted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Sync state changes back to URL (Part A2)
  useEffect(() => {
    const newPath = `/bible/${book}/${chapter}?version=${versionId}`;
    if (window.location.pathname !== `/bible/${book}/${chapter}` || window.location.search !== `?version=${versionId}`) {
      window.history.replaceState(null, '', newPath);
    }
    localStorage.setItem('yv_version_id', String(versionId));
  }, [book, chapter, versionId]);

  // Handle browser back/forward buttons (Part A2)
  useEffect(() => {
    const handlePop = () => {
      const current = getUrlParams();
      setBook(current.book);
      setChapter(current.chapter);
      setVersionId(current.versionId);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Scroll to top on navigation (Part A1)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [book, chapter, versionId]);

  // Load Reactions & Streak (Part C & D)
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const count = await fetchReactionCount(book, chapter);
      if (active) {
        setReactionsCount(count);
        setHasUserReacted(hasReacted(book, chapter));
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [book, chapter]);

  // Manage Daily Reading Streak (Part D)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastRead = localStorage.getItem('ft_bible_last_read_date');
    const savedStreak = localStorage.getItem('ft_bible_streak');
    let currentStreak = savedStreak ? Number(savedStreak) : 0;

    if (!lastRead) {
      currentStreak = 1;
    } else {
      const lastReadDate = new Date(lastRead);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate.getTime() - lastReadDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    localStorage.setItem('ft_bible_last_read_date', todayStr);
    localStorage.setItem('ft_bible_streak', String(currentStreak));
    setStreak(currentStreak);
  }, [book, chapter]);

  // Reset selection on chapter change
  useEffect(() => {
    setSelectedVerses([]);
  }, [book, chapter, versionId]);

  // Apply Highlight and Selection Styling via MutationObserver
  const applyHighlightsAndStyles = () => {
    const verses = document.querySelectorAll('.yv-v');
    verses.forEach((el) => {
      const verseNumStr = el.getAttribute('v');
      if (!verseNumStr) return;
      const verseNum = Number(verseNumStr);

      // Make clickable
      el.classList.add('cursor-pointer', 'transition-all', 'duration-200');

      // Load cached highlights
      const cacheKey = `highlight:${book}.${chapter}.${verseNum}:${versionId}`;
      const savedColor = localStorage.getItem(cacheKey);

      // Reset classes
      el.classList.remove(
        'bg-[#1CABB9]/25', 
        'bg-amber-400/35', 
        'bg-pink-400/30', 
        'bg-violet-400/30', 
        'border-b-2', 
        'border-[#1CABB9]/40',
        'border-amber-400/50',
        'border-pink-400/40',
        'border-violet-400/40',
        'bg-[#372f58]/15',
        'ring-2',
        'ring-[#372f58]/20',
        'rounded-md',
        'px-1'
      );

      // Render highlights
      if (savedColor) {
        if (savedColor === 'teal') {
          el.classList.add('bg-[#1CABB9]/25', 'border-b-2', 'border-[#1CABB9]/40');
        } else if (savedColor === 'gold') {
          el.classList.add('bg-amber-400/35', 'border-b-2', 'border-amber-400/50');
        } else if (savedColor === 'pink') {
          el.classList.add('bg-pink-400/30', 'border-b-2', 'border-pink-400/40');
        } else if (savedColor === 'purple') {
          el.classList.add('bg-violet-400/30', 'border-b-2', 'border-violet-400/40');
        }
      }

      // Render selections (selected status wins visual priority)
      if (selectedVerses.includes(verseNum)) {
        el.classList.add('bg-[#372f58]/15', 'ring-2', 'ring-[#372f58]/20', 'rounded-md', 'px-1');
      }
    });
  };

  useEffect(() => {
    applyHighlightsAndStyles();

    const target = document.querySelector('.yv-reader-wrapper');
    if (!target) return;

    const observer = new MutationObserver(() => {
      applyHighlightsAndStyles();
    });

    observer.observe(target, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [book, chapter, versionId, selectedVerses]);

  // Click Event Delegation for Verse Selection
  useEffect(() => {
    const container = document.querySelector('.yv-reader-wrapper');
    if (!container) return;

    const handleContainerClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const verseEl = target.closest('.yv-v');
      if (!verseEl) return;

      const verseNumStr = verseEl.getAttribute('v');
      if (!verseNumStr) return;

      const num = Number(verseNumStr);

      setSelectedVerses((prev) => {
        if (prev.includes(num)) {
          if (prev.length === 1) return [];
          return [num];
        }

        if (prev.length === 1) {
          const start = prev[0];
          const minVal = Math.min(start, num);
          const maxVal = Math.max(start, num);
          const range: number[] = [];
          for (let i = minVal; i <= maxVal; i++) {
            range.push(i);
          }
          return range;
        }

        return [num];
      });
    };

    container.addEventListener('click', handleContainerClick);
    return () => container.removeEventListener('click', handleContainerClick);
  }, [book, chapter, versionId]);

  const handleVersionChange = (id: number) => {
    // Only accept approved versions (Part B)
    if (APPROVED_VERSIONS.some((v) => v.id === id)) {
      setVersionId(id);
    }
  };

  const handleReact = async () => {
    if (hasUserReacted) return;
    setHasUserReacted(true);
    setReactionsCount((prev) => prev + 1);
    const updatedCount = await incrementReactionCount(book, chapter);
    setReactionsCount(updatedCount);
  };

  const currentVersionLabel = APPROVED_VERSIONS.find((v) => v.id === versionId)?.label || 'Berean Standard Bible (BSB)';

  // Highlights handler (persisted locally)
  const handleHighlightColor = (color: 'teal' | 'gold' | 'pink' | 'purple' | 'clear') => {
    selectedVerses.forEach((vNum) => {
      const cacheKey = `highlight:${book}.${chapter}.${vNum}:${versionId}`;
      if (color === 'clear') {
        localStorage.removeItem(cacheKey);
      } else {
        localStorage.setItem(cacheKey, color);
      }
    });
    applyHighlightsAndStyles();
    setSelectedVerses([]);
    showToast(color === 'clear' ? 'Highlight cleared!' : 'Highlight saved!');
    setIsHighlightMenuOpen(false);
  };

  // Formatted copy handler (Appends reference & translation label)
  const handleCopy = () => {
    if (selectedVerses.length === 0) return;
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const textParts: string[] = [];

    sorted.forEach((vNum) => {
      const el = document.querySelector(`.yv-v[v="${vNum}"]`);
      if (el) {
        const clone = el.cloneNode(true) as HTMLElement;
        const label = clone.querySelector('.label, .v-num, sup, .verse-num');
        if (label) {
          label.remove();
        }
        textParts.push(clone.textContent?.trim() || '');
      }
    });

    const fullText = textParts.join(' ');
    const versionLabel = APPROVED_VERSIONS.find((v) => v.id === versionId)?.label.split('(')[1]?.replace(')', '') || 'BSB';
    const bookName = BOOK_NAMES[book] || book;
    const refString = sorted.length === 1
      ? `${bookName} ${chapter}:${sorted[0]}`
      : `${bookName} ${chapter}:${sorted[0]}-${sorted[sorted.length - 1]}`;

    const formattedText = `"${fullText}" — ${refString} (${versionLabel})`;

    navigator.clipboard.writeText(formattedText);
    showToast('Copied to clipboard!');
    setSelectedVerses([]);
  };

  // Canvas Image Generator for Share Card (Part C2)
  const drawShareCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 600);
    grad.addColorStop(0, '#372f58');
    grad.addColorStop(1, '#1CABB9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 600);

    // Decorative circle overlays
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.arc(600, 0, 300, 0, 2 * Math.PI);
    ctx.fill();

    // Brand Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('RCCG FAITH TRIBE BIBLE', 50, 70);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px sans-serif';
    ctx.fillText('A digital ministry of RCCG Region 63 Junior Church', 50, 95);

    // main selection reference
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const refVerses = sorted.length === 1 
      ? `:${sorted[0]}` 
      : (sorted.length > 1 ? `:${sorted[0]}-${sorted[sorted.length - 1]}` : '');
      
    const bookName = BOOK_NAMES[book] || book;
    const displayRef = `${bookName} ${chapter}${refVerses}`;

    // Main Quote block
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 28px sans-serif';
    const text1 = `Join me in reading`;
    const text2 = displayRef;
    ctx.fillText(text1, 50, 240);
    ctx.font = 'italic bold 42px sans-serif';
    ctx.fillText(text2, 50, 300);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Translation: ${currentVersionLabel}`, 50, 360);

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(50, 480);
    ctx.lineTo(550, 480);
    ctx.stroke();

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Read, study, and grow together online.', 50, 515);
    ctx.fillText('faithtribe.app', 50, 540);

    // Draw circular logo image
    const img = new Image();
    img.src = '/Faith_Tribe_Circular.png';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(520, 70, 35, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(img, 485, 35, 70, 70);
      ctx.restore();
      setShareCardUrl(canvas.toDataURL('image/png'));
    };

    // Set fallback if logo fails or loads instantly
    setShareCardUrl(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    if (isShareModalOpen) {
      drawShareCard();
    }
  }, [isShareModalOpen, book, chapter, versionId, selectedVerses]);

  const handleShareClick = async () => {
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const refVerses = sorted.length === 1 
      ? `:${sorted[0]}` 
      : (sorted.length > 1 ? `:${sorted[0]}-${sorted[sorted.length - 1]}` : '');
      
    const bookName = BOOK_NAMES[book] || book;
    const displayRef = `${bookName} ${chapter}${refVerses}`;
    const shareUrl = window.location.href;
    const shareText = `Come read the Bible with me! ${displayRef} (${currentVersionLabel}) on Faith Tribe.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Faith Tribe Bible',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.warn("Navigator share aborted:", err);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const copyBibleLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Bible link copied to clipboard!');
    setIsMoreMenuOpen(false);
  };

  const handleReport = () => {
    alert('Thank you. A report has been sent to the Region 63 moderators.');
    setIsMoreMenuOpen(false);
  };

  return (
    <div className="min-h-screen mesh-gradient py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white/75 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] border border-white/50 shadow-xl relative overflow-visible">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-[#372f58]/10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-[#372f58] hover:text-[#1CABB9] transition-colors cursor-pointer self-start"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
          
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            {/* Reading Streak flame tracker */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-3.5 py-1.5 rounded-full text-xs font-black select-none border border-amber-500/20">
              <Flame size={14} className="fill-amber-500 animate-pulse" />
              <span>{streak}-DAY STREAK</span>
            </div>

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
        </div>

        {/* Translation Dropdown (Top) */}
        <div className="flex flex-col gap-2 mb-6">
          <label htmlFor="version-select" className="text-xs font-bold text-[#372f58]/80 uppercase tracking-wider">
            Translation
          </label>
          <div className="relative max-w-xs">
            <select
              id="version-select"
              value={versionId}
              onChange={(e) => handleVersionChange(Number(e.target.value))}
              className="w-full bg-white/80 border border-gray-200 text-[#372f58] font-bold text-sm px-4 py-2.5 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1CABB9] cursor-pointer appearance-none"
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

        {/* YouVersion Bible Reader Wrapper */}
        <div className="yv-reader-wrapper border border-[#372f58]/10 rounded-3xl p-4 sm:p-6 bg-white/40 shadow-inner relative">
          <BibleReader.Root
            book={book}
            onBookChange={setBook}
            chapter={chapter}
            onChapterChange={setChapter}
            versionId={versionId}
            onVersionChange={handleVersionChange}
            onVersionPickerPress={() => setIsBottomPickerOpen(true)}
          >
            <BibleReader.Content />

            {/* Custom Engagement Layer */}
            <div className="mt-8 pt-6 border-t border-[#372f58]/15 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReact}
                  disabled={hasUserReacted}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm
                    ${hasUserReacted 
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/25' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'}`}
                >
                  <Flame size={16} className={`transition-transform ${hasUserReacted ? 'fill-amber-500 scale-110 text-amber-500' : 'text-gray-500 group-hover:scale-110'}`} />
                  <span>{hasUserReacted ? 'Amen' : 'Say Amen'}</span>
                </button>
                {reactionsCount > 0 && (
                  <span className="text-xs font-bold text-gray-500">
                    {reactionsCount} {reactionsCount === 1 ? 'person said' : 'people said'} Amen
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 relative">
                <button
                  onClick={handleShareClick}
                  className="flex items-center gap-2 bg-[#1CABB9] hover:bg-[#158f9c] text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#1CABB9]/25 cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>SHARE PASSAGE</span>
                </button>

                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical size={16} />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30">
                    <button
                      onClick={copyBibleLink}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#372f58] hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Copy size={14} /> Copy link
                    </button>
                    <button
                      onClick={handleReport}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50/50 flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle size={14} /> Report issue
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#372f58]/10">
              <BibleReader.Toolbar />
            </div>
          </BibleReader.Root>
        </div>
      </div>

      {/* Part B: Custom Approved Versions Picker Overlay */}
      {isBottomPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm border border-gray-100 shadow-2xl relative">
            <h3 className="text-lg font-black text-[#372f58] mb-4">Select Translation</h3>
            <div className="space-y-2">
              {APPROVED_VERSIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    handleVersionChange(v.id);
                    setIsBottomPickerOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-between ${versionId === v.id ? 'bg-[#1CABB9]/10 text-[#1CABB9]' : 'hover:bg-gray-50 text-[#372f58]'}`}
                >
                  <span>{v.label}</span>
                  {versionId === v.id && <Check size={16} />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsBottomPickerOpen(false)}
              className="mt-6 w-full py-3 bg-[#372f58] hover:bg-[#282142] text-white font-black rounded-2xl text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Part C2: Branded Share Card Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md border border-gray-100 shadow-2xl relative flex flex-col items-center">
            <h3 className="text-lg font-black text-[#372f58] mb-4 self-start">Share Branded Card</h3>
            
            {shareCardUrl ? (
              <img 
                src={shareCardUrl} 
                className="w-full aspect-square object-contain rounded-2xl border border-gray-100 shadow-inner mb-6" 
                alt="Branded Bible Card"
              />
            ) : (
              <div className="w-full aspect-square bg-[#372f58] animate-pulse rounded-2xl mb-6"></div>
            )}

            <div className="flex gap-3 w-full">
              <a
                href={shareCardUrl}
                download={`faith_tribe_${book}_${chapter}.png`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1CABB9] hover:bg-[#158f9c] text-white py-3 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#1CABB9]/25 text-center cursor-pointer"
              >
                <Download size={16} /> Download Card
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${book} Chapter ${chapter} (${currentVersionLabel})\n${window.location.href}`);
                  alert('Verse text and link copied!');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#372f58] font-black rounded-2xl text-sm transition-colors cursor-pointer"
              >
                Copy Text & Link
              </button>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Floating Verse Action Bar */}
      {selectedVerses.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#372f58]/95 backdrop-blur-md border border-white/10 rounded-full py-3.5 px-6 shadow-2xl flex items-center gap-6 text-white text-xs font-black animate-in fade-in slide-in-from-bottom duration-300">
          <span className="text-[#1CABB9] border-r border-white/15 pr-4 select-none">
            {selectedVerses.length} {selectedVerses.length === 1 ? 'verse' : 'verses'} selected
          </span>

          <div className="relative">
            <button
              onClick={() => setIsHighlightMenuOpen(!isHighlightMenuOpen)}
              className="hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Highlighter size={14} />
              <span>HIGHLIGHT</span>
            </button>

            {/* Highlights Submenu */}
            {isHighlightMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white rounded-3xl p-3 shadow-2xl border border-gray-100 flex items-center gap-3 z-50 animate-in zoom-in-95 duration-200">
                <button
                  onClick={() => handleHighlightColor('teal')}
                  className="w-7 h-7 rounded-full bg-[#1CABB9] border-2 border-white shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title="Teal Highlight"
                />
                <button
                  onClick={() => handleHighlightColor('gold')}
                  className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title="Amber Highlight"
                />
                <button
                  onClick={() => handleHighlightColor('pink')}
                  className="w-7 h-7 rounded-full bg-pink-500 border-2 border-white shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title="Pink Highlight"
                />
                <button
                  onClick={() => handleHighlightColor('purple')}
                  className="w-7 h-7 rounded-full bg-violet-500 border-2 border-white shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title="Purple Highlight"
                />
                <div className="w-[1px] h-5 bg-gray-200" />
                <button
                  onClick={() => handleHighlightColor('clear')}
                  className="p-1 text-gray-500 hover:text-red-500 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                  title="Clear Highlight"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={14} />
            <span>COPY</span>
          </button>

          <button
            onClick={handleShareClick}
            className="hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={14} />
            <span>SHARE</span>
          </button>

          <button
            onClick={() => setSelectedVerses([])}
            className="text-gray-450 hover:text-white transition-colors cursor-pointer text-[10px] pl-2 border-l border-white/15"
          >
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}
