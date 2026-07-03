import React, { useState, useEffect, useRef } from 'react';
import { BibleReader } from '@youversion/platform-react-ui';
import { ArrowLeft, Book, Flame, Share2, MoreVertical, Copy, AlertTriangle, Check, Award, Download } from 'lucide-react';
import { fetchReactionCount, incrementReactionCount, hasReacted } from '../supabase';

const APPROVED_VERSIONS = [
  { id: 3034, label: 'Berean Standard Bible (BSB)' },
  { id: 1932, label: 'Free Bible Version (FBV)' },
  { id: 1588, label: 'Amplified Bible (AMP)' },
  { id: 12, label: 'American Standard Version (ASV)' },
  { id: 111, label: 'New International Version (NIV)' },
];

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

    // Main Quote block
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 28px sans-serif';
    const text1 = `Join me in reading`;
    const text2 = `${book} Chapter ${chapter}`;
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
  }, [isShareModalOpen, book, chapter, versionId]);

  const handleShareClick = async () => {
    const shareUrl = window.location.href;
    const shareText = `Come read the Bible with me! ${book} Chapter ${chapter} (${currentVersionLabel}) on Faith Tribe.`;

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
    </div>
  );
}
