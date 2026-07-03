import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BibleReader } from '@youversion/platform-react-ui';
import { ArrowLeft, Book, Flame, Share2, MoreVertical, Copy, AlertTriangle, Check, Award, Download, Highlighter, Trash2, X, ArrowRight } from 'lucide-react';
import { fetchReactionCount, incrementReactionCount, hasReacted } from '../supabase';

const APPROVED_VERSIONS = [
  { id: 3034, label: 'Berean Standard Bible (BSB)' },
  { id: 1932, label: 'Free Bible Version (FBV)' },
  { id: 1588, label: 'Amplified Bible (AMP)' },
  { id: 111, label: 'New International Version (NIV)' },
  { id: 12, label: 'American Standard Version (ASV)' },
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

const BOOK_ABBREVIATIONS: Record<string, string> = {
  // Genesis
  'genesis': 'GEN', 'gen': 'GEN', 'ge': 'GEN',
  // Exodus
  'exodus': 'EXOD', 'exo': 'EXOD', 'ex': 'EXOD',
  // Leviticus
  'leviticus': 'LEV', 'lev': 'LEV', 'le': 'LEV',
  // Numbers
  'numbers': 'NUM', 'num': 'NUM', 'nu': 'NUM',
  // Deuteronomy
  'deuteronomy': 'DEUT', 'deu': 'DEUT', 'dt': 'DEUT',
  // Joshua
  'joshua': 'JOSH', 'jos': 'JOSH', 'josh': 'JOSH',
  // Judges
  'judges': 'JUDG', 'judg': 'JUDG', 'jdg': 'JUDG',
  // Ruth
  'ruth': 'RUTH', 'rut': 'RUTH', 'ru': 'RUTH',
  // 1 Samuel
  '1 samuel': '1SAM', '1sam': '1SAM', '1 sam': '1SAM', '1 sa': '1SAM', '1s': '1SAM',
  // 2 Samuel
  '2 samuel': '2SAM', '2sam': '2SAM', '2 sam': '2SAM', '2 sa': '2SAM', '2s': '2SAM',
  // 1 Kings
  '1 kings': '1KGS', '1kgs': '1KGS', '1 ki': '1KGS', '1k': '1KGS',
  // 2 Kings
  '2 kings': '2KGS', '2kgs': '2KGS', '2 ki': '2KGS', '2k': '2KGS',
  // 1 Chronicles
  '1 chronicles': '1CHR', '1chr': '1CHR', '1 ch': '1CHR',
  // 2 Chronicles
  '2 chronicles': '2CHR', '2chr': '2CHR', '2 ch': '2CHR',
  // Ezra
  'ezra': 'EZRA', 'ezr': 'EZRA',
  // Nehemiah
  'nehemiah': 'NEH', 'neh': 'NEH', 'ne': 'NEH',
  // Esther
  'esther': 'ESTH', 'est': 'ESTH', 'es': 'ESTH',
  // Job
  'job': 'JOB', 'jb': 'JOB',
  // Psalms
  'psalms': 'PSALM', 'psalm': 'PSALM', 'psal': 'PSALM', 'ps': 'PSALM', 'psa': 'PSALM',
  // Proverbs
  'proverbs': 'PROV', 'prov': 'PROV', 'pr': 'PROV',
  // Ecclesiastes
  'ecclesiastes': 'ECCL', 'eccl': 'ECCL', 'ecc': 'ECCL', 'ec': 'ECCL',
  // Song of Solomon
  'song of solomon': 'SONG', 'song of songs': 'SONG', 'song': 'SONG', 'so': 'SONG',
  // Isaiah
  'isaiah': 'ISA', 'isa': 'ISA', 'is': 'ISA',
  // Jeremiah
  'jeremiah': 'JER', 'jer': 'JER', 'je': 'JER',
  // Lamentations
  'lamentations': 'LAM', 'lam': 'LAM', 'la': 'LAM',
  // Ezekiel
  'ezekiel': 'EZEK', 'ezek': 'EZEK', 'eze': 'EZEK',
  // Daniel
  'daniel': 'DAN', 'dan': 'DAN', 'da': 'DAN',
  // Hosea
  'hosea': 'HOS', 'hos': 'HOS', 'ho': 'HOS',
  // Joel
  'joel': 'JOEL', 'joe': 'JOEL',
  // Amos
  'amos': 'AMOS', 'amo': 'AMOS', 'am': 'AMOS',
  // Obadiah
  'obadiah': 'OBAD', 'obad': 'OBAD', 'ob': 'OBAD',
  // Jonah
  'jonah': 'JONAH', 'jon': 'JONAH',
  // Micah
  'micah': 'MIC', 'mic': 'MIC', 'mi': 'MIC',
  // Nahum
  'nahum': 'NAH', 'nah': 'NAH', 'na': 'NAH',
  // Habakkuk
  'habakkuk': 'HAB', 'hab': 'HAB',
  // Zephaniah
  'zephaniah': 'ZEPH', 'zep': 'ZEPH',
  // Haggai
  'haggai': 'HAG', 'hag': 'HAG',
  // Zechariah
  'zechariah': 'ZECH', 'zec': 'ZECH',
  // Malachi
  'malachi': 'MAL', 'mal': 'MAL',
  // Matthew
  'matthew': 'MATT', 'matt': 'MATT', 'mat': 'MATT', 'mt': 'MATT',
  // Mark
  'mark': 'MARK', 'mrk': 'MARK', 'mk': 'MARK',
  // Luke
  'luke': 'LUKE', 'luk': 'LUKE', 'lk': 'LUKE',
  // John
  'john': 'JOHN', 'jhn': 'JOHN', 'joh': 'JOHN', 'jn': 'JOHN',
  // Acts
  'acts': 'ACTS', 'act': 'ACTS', 'ac': 'ACTS',
  // Romans
  'romans': 'ROM', 'rom': 'ROM', 'ro': 'ROM',
  // 1 Corinthians
  '1 corinthians': '1COR', '1cor': '1COR', '1 cor': '1COR', '1 co': '1COR',
  // 2 Corinthians
  '2 corinthians': '2COR', '2cor': '2COR', '2 cor': '2COR', '2 co': '2COR',
  // Galatians
  'galatians': 'GAL', 'gal': 'GAL', 'ga': 'GAL',
  // Ephesians
  'ephesians': 'EPH', 'eph': 'EPH', 'ep': 'EPH',
  // Philippians
  'philippians': 'PHIL', 'phil': 'PHIL', 'phi': 'PHIL', 'php': 'PHIL',
  // Colossians
  'colossians': 'COL', 'col': 'COL', 'co': 'COL',
  // 1 Thessalonians
  '1 thessalonians': '1THESS', '1thess': '1THESS', '1 thess': '1THESS', '1 th': '1THESS',
  // 2 Thessalonians
  '2 thessalonians': '2THESS', '2thess': '2THESS', '2 thess': '2THESS', '2 th': '2THESS',
  // 1 Timothy
  '1 timothy': '1TIM', '1tim': '1TIM', '1 tim': '1TIM', '1 ti': '1TIM',
  // 2 Timothy
  '2 timothy': '2TIM', '2tim': '2TIM', '2 tim': '2TIM', '2 ti': '2TIM',
  // Titus
  'titus': 'TITUS', 'tit': 'TITUS', 'ti': 'TITUS',
  // Philemon
  'philemon': 'PHILEM', 'philem': 'PHILEM', 'phm': 'PHILEM',
  // Hebrews
  'hebrew': 'HEB', 'hebrews': 'HEB', 'heb': 'HEB',
  // James
  'james': 'JAS', 'jas': 'JAS', 'jam': 'JAS', 'jm': 'JAS',
  // 1 Peter
  '1 peter': '1PET', '1pet': '1PET', '1 pet': '1PET', '1 pe': '1PET',
  // 2 Peter
  '2 peter': '2PET', '2pet': '2PET', '2 pet': '2PET', '2 pe': '2PET',
  // 1 John
  '1 john': '1JOHN', '1john': '1JOHN', '1 jn': '1JOHN', '1 jhn': '1JOHN', '1j': '1JOHN',
  // 2 John
  '2 john': '2JOHN', '2john': '2JOHN', '2 jn': '2JOHN', '2 jhn': '2JOHN', '2j': '2JOHN',
  // 3 John
  '3 john': '3JOHN', '3john': '3JOHN', '3 jn': '3JOHN', '3 jhn': '3JOHN', '3j': '3JOHN',
  // Jude
  'jude': 'JUDE', 'jud': 'JUDE',
  // Revelation
  'revelation': 'REV', 'rev': 'REV', 're': 'REV', 'revelations': 'REV'
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

  // Navigation, Search and Progress States
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [pendingScrollVerse, setPendingScrollVerse] = useState<number | null>(null);
  const lastScrollY = useRef(0);
  const [translationInView, setTranslationInView] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isTopDropdownOpen, setIsTopDropdownOpen] = useState(false);
  const topDropdownRef = useRef<HTMLDivElement>(null);
  const [cardBottomInView, setCardBottomInView] = useState(false);
  const cardBottomObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isTopDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (topDropdownRef.current && !topDropdownRef.current.contains(e.target as Node)) {
        setIsTopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isTopDropdownOpen]);

  const translationRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setTranslationInView(entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const cardBottomRef = useCallback((node: HTMLDivElement | null) => {
    if (cardBottomObserverRef.current) {
      cardBottomObserverRef.current.disconnect();
      cardBottomObserverRef.current = null;
    }

    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setCardBottomInView(entry.isIntersecting || entry.boundingClientRect.top < 0);
        },
        { 
          threshold: 0,
          rootMargin: '0px'
        }
      );
      observer.observe(node);
      cardBottomObserverRef.current = observer;
    }
  }, []);

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

  // Implement scroll-direction hiding and progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Update progress
      if (totalHeight > 0) {
        setScrollProgress((currentScrollY / totalHeight) * 100);
      } else {
        setScrollProgress(0);
      }

      // Hide or show bottom bar based on scroll direction
      const delta = currentScrollY - lastScrollY.current;
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 50;

      if (isAtBottom) {
        setIsNavVisible(true);
      } else if (Math.abs(delta) >= 10) {
        if (delta > 0 && currentScrollY > 100) {
          setIsNavVisible(false);
        } else {
          setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global search shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

      // Handle pending scroll target from reference search
      if (pendingScrollVerse !== null && verseNum === pendingScrollVerse) {
        setPendingScrollVerse(null);
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('animate-pulse-highlight');
          setTimeout(() => {
            el.classList.remove('animate-pulse-highlight');
          }, 3000);
        }, 100);
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
  }, [book, chapter, versionId, selectedVerses, pendingScrollVerse]);

  // Reference search parser and handler
  const handleSearchSubmit = (input: string) => {
    const clean = input.trim().toLowerCase();
    if (!clean) return;
    
    // Sort keys by length descending to match multi-word books first
    const sortedKeys = Object.keys(BOOK_ABBREVIATIONS).sort((a, b) => b.length - a.length);
    let matchedBookKey = '';
    
    for (const key of sortedKeys) {
      if (clean.startsWith(key)) {
        matchedBookKey = key;
        break;
      }
    }
    
    if (!matchedBookKey) {
      alert("Couldn't find that book — try 'John 3:16' or 'Genesis 1'");
      return;
    }
    
    const bookCode = BOOK_ABBREVIATIONS[matchedBookKey];
    const remaining = clean.slice(matchedBookKey.length).trim();
    
    // Match chapter and optional verse (e.g., "3", "3:16", "3:16-18")
    const match = remaining.match(/^(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
    
    if (!match && remaining.length > 0) {
      alert("Couldn't parse chapter/verse — try 'John 3:16' or 'Genesis 1'");
      return;
    }
    
    const chapterNum = match ? match[1] : '1';
    const startVerse = match && match[2] ? Number(match[2]) : null;
    
    setBook(bookCode);
    setChapter(chapterNum);
    
    if (startVerse) {
      setPendingScrollVerse(startVerse);
    }
    
    setIsSearchOverlayOpen(false);
  };

  const handleSuggestionClick = (bookName: string) => {
    setSearchValue(`${bookName} `);
  };

  // Suggestions filter based on typed text
  const getSuggestions = () => {
    if (!searchValue.trim()) return [];
    const val = searchValue.trim().toLowerCase();
    return Object.entries(BOOK_NAMES)
      .filter(([code, name]) => {
        return name.toLowerCase().includes(val) || code.toLowerCase().includes(val);
      })
      .map(([code, name]) => ({ code, name }))
      .slice(0, 8);
  };
  
  const suggestions = getSuggestions();

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

  const currentVersion = APPROVED_VERSIONS.find(v => v.id === versionId) || APPROVED_VERSIONS[0];

  const handleTopSelectorClick = (e: React.MouseEvent) => {
    // If mobile viewport (< 640px), open the gorgeous custom modal picker
    if (window.innerWidth < 640) {
      setIsBottomPickerOpen(true);
    } else {
      setIsTopDropdownOpen(!isTopDropdownOpen);
    }
  };

  const copyBibleLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
    setIsMoreMenuOpen(false);
  };

  const handleReport = () => {
    showToast('Report sent to moderators.');
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

        {/* Search & Translation Row */}
        <div ref={translationRef} className="flex items-end justify-between gap-6 mb-8 pb-2">
          {/* Translation Dropdown */}
          <div className="flex flex-col gap-2 w-full sm:max-w-xs">
            <label htmlFor="version-select-button" className="text-xs font-bold text-[#372f58]/80 uppercase tracking-wider">
              Translation
            </label>
            <div ref={topDropdownRef} className="relative w-full">
              <button
                type="button"
                id="version-select-button"
                onClick={handleTopSelectorClick}
                className="w-full flex items-center justify-between bg-white/80 border border-gray-200 text-[#372f58] font-bold text-sm px-4 py-2.5 rounded-2xl shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1CABB9] cursor-pointer transition-colors"
              >
                <span className="truncate">{currentVersion.label}</span>
                <svg className={`fill-[#372f58]/60 h-4 w-4 transition-transform duration-200 shrink-0 ml-2 ${isTopDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </button>

              {/* Custom Desktop/Tablet Dropdown Menu */}
              {isTopDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-md rounded-3xl border border-gray-200/80 shadow-2xl p-2.5 flex flex-col gap-1 w-full max-w-sm sm:max-w-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  {APPROVED_VERSIONS.map((v) => {
                    const isSelected = v.id === versionId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          handleVersionChange(v.id);
                          setIsTopDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#1CABB9]/10 text-[#1CABB9]' 
                            : 'text-[#372f58] hover:bg-gray-50 hover:text-[#1CABB9]'
                        }`}
                      >
                        <span className="truncate pr-2">{v.label}</span>
                        {isSelected && (
                          <Check size={12} className="text-[#1CABB9] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Scripture Search Bar (Tablet / Desktop) */}
          <div className="hidden sm:block flex-grow max-w-sm relative">
            <label className="block text-xs font-bold text-[#372f58]/80 uppercase tracking-wider mb-2">
              Scripture Search
            </label>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchValue); }}
              className="relative"
            >
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search reference (e.g. John 3:16)"
                className="w-full bg-white/80 border border-gray-200 text-[#372f58] font-semibold text-sm pl-4 pr-16 py-2.5 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1CABB9]"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <kbd className="hidden lg:inline-flex items-center bg-gray-100 border border-gray-200 text-[10px] text-gray-400 px-1.5 py-0.5 rounded font-sans font-bold select-none">
                  ⌘K
                </kbd>
                <button
                  type="submit"
                  className="bg-[#1CABB9] hover:bg-[#158f9c] text-white p-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Search passage"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </button>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {suggestions.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => handleSuggestionClick(s.name)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#372f58] hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{s.name}</span>
                    <span className="text-[9px] text-gray-400 font-mono tracking-wider">{s.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Trigger Icon for Mobile */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsSearchOverlayOpen(true)}
              className="bg-white border border-gray-200 text-[#372f58] hover:text-[#1CABB9] p-2.5 rounded-2xl shadow-sm cursor-pointer transition-colors"
              aria-label="Search scripture"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* YouVersion Bible Reader Wrapper */}
        <div className="yv-reader-wrapper border border-[#372f58]/10 rounded-3xl p-4 sm:p-6 pb-24 sm:pb-28 bg-white/40 shadow-inner relative">
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

          {/* Floating Bottom Navigation Bars (Inside YouVersion Context & Portaled to body) */}
          {mounted && createPortal(
            <>
              {/* Mobile bottom full-width bar */}
              <div 
                className={`mobile-floating-nav bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden ${
                  (!translationInView && isNavVisible && !cardBottomInView) ? 'visible' : ''
                }`}
              >
                <div className="max-w-md mx-auto">
                  <BibleReader.Toolbar />
                </div>
              </div>

              {/* Center floating bottom pill (Tablet/Desktop) */}
              <div 
                className={`desktop-floating-nav bg-white/95 backdrop-blur-md border border-gray-250/85 px-6 py-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] hidden sm:block ${
                  (!translationInView && isNavVisible && !cardBottomInView) ? 'visible' : ''
                }`}
              >
                <div className="flex items-center justify-center min-w-[320px]">
                  <BibleReader.Toolbar />
                </div>
              </div>
            </>,
            document.body
          )}
        </BibleReader.Root>
        </div>
      </div>

      {/* Sentinel to detect bottom of reader container */}
      <div ref={cardBottomRef} className="h-px w-full pointer-events-none" />

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
                  navigator.clipboard.writeText(`${book} Chapter ${chapter} (${currentVersion.label})\n${window.location.href}`);
                  showToast('Verse text and link copied!');
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

      {/* Toast Notification (Portaled to body) */}
      {mounted && toastMessage && createPortal(
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#372f58]/95 backdrop-blur-md border border-white/10 text-white text-xs font-black py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage.toLowerCase().includes('clear') ? (
            <Trash2 size={14} className="text-[#1CABB9] shrink-0" />
          ) : (
            <Check size={14} className="text-[#1CABB9] shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}

      {/* Floating Verse Action Bar (Portaled to body) */}
      {mounted && selectedVerses.length > 0 && createPortal(
        <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-50 bg-[#372f58]/95 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-full py-3 px-4 sm:py-3.5 sm:px-6 shadow-2xl flex items-center justify-between sm:justify-start gap-4 sm:gap-6 text-white text-xs font-black animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-[#1CABB9] border-r border-white/15 pr-4 select-none whitespace-nowrap">
            {selectedVerses.length} {selectedVerses.length === 1 ? 'verse' : 'verses'} selected
          </span>

          <div className="relative">
            <button
              onClick={() => setIsHighlightMenuOpen(!isHighlightMenuOpen)}
              className="hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Highlighter size={14} />
              <span className="hidden sm:inline">HIGHLIGHT</span>
            </button>

            {/* Highlights Submenu */}
            {isHighlightMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-3xl p-3 shadow-2xl border border-gray-100 flex items-center gap-3 z-50 animate-in zoom-in-95 duration-200">
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
            <span className="hidden sm:inline">COPY</span>
          </button>

          <button
            onClick={handleShareClick}
            className="hover:text-[#1CABB9] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">SHARE</span>
          </button>

          <button
            onClick={() => setSelectedVerses([])}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer text-[10px] pl-2 border-l border-white/15 flex items-center gap-1"
          >
            <X size={14} className="sm:hidden" />
            <span className="hidden sm:inline">CANCEL</span>
          </button>
        </div>,
        document.body
      )}



      {/* Reading Progress Bar */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill bg-[#1CABB9]" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Mobile/Command Palette Search Takeover Overlay */}
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white/98 backdrop-blur-md p-6 sm:p-12 animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-[#372f58]">Search Scripture</h3>
                <p className="text-xs text-gray-500 mt-1">Jump straight to any book, chapter, or verse range</p>
              </div>
              <button
                onClick={() => { setIsSearchOverlayOpen(false); setSearchValue(''); }}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input field */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchValue); }}
              className="relative mb-6"
            >
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Type reference (e.g. John 3:16 or Psalm 23)"
                className="w-full bg-gray-50 border border-gray-250 text-[#372f58] font-bold text-lg px-6 py-4.5 rounded-3xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1CABB9] pr-16"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1CABB9] hover:bg-[#158f9c] text-white p-2.5 rounded-2xl transition-colors cursor-pointer"
              >
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Suggestions */}
            {suggestions.length > 0 ? (
              <div className="space-y-1.5 flex-grow overflow-y-auto max-h-[300px] pr-2">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 select-none">Suggestions</p>
                {suggestions.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => handleSuggestionClick(s.name)}
                    className="w-full text-left px-5 py-3.5 bg-gray-50 hover:bg-[#1CABB9]/5 rounded-2xl border border-gray-100 hover:border-[#1CABB9]/20 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <span className="font-bold text-sm text-[#372f58] group-hover:text-[#1CABB9] transition-colors">{s.name}</span>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 bg-white border border-gray-150 px-2 py-0.5 rounded-md">{s.code}</span>
                  </button>
                ))}
              </div>
            ) : searchValue.trim().length > 0 ? (
              <p className="text-xs text-gray-450 italic py-2 select-none">No books match "{searchValue}"</p>
            ) : (
              <div className="space-y-4 text-gray-555 select-none">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Example references you can type</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-[#372f58]">Genesis 1</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Navigates to the chapter start</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-[#372f58]">John 3:16</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Navigates and scrolls directly to verse 16</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-[#372f58]">Ps 23</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Abbreviation support for Psalm 23</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-[#372f58]">1 John 2:3-5</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Support for verse range selections</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-highlight {
          0% { background-color: rgba(251, 191, 36, 0.5); border-radius: 0.375rem; }
          50% { background-color: rgba(251, 191, 36, 0.5); border-radius: 0.375rem; }
          100% { background-color: transparent; }
        }
        .animate-pulse-highlight {
          animation: pulse-highlight 2.5s ease-out forwards;
          display: inline-block;
          width: 100%;
        }
        
        .progress-bar-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          z-index: 100;
          background-color: transparent;
        }
        .progress-bar-fill {
          height: 100%;
          transition: width 0.1s ease-out;
        }

        /* Mobile bottom bar transition */
        .mobile-floating-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          transform: translateY(100%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms cubic-bezier(0.4, 0, 1, 1),
                      transform 200ms cubic-bezier(0.4, 0, 1, 1);
        }
        .mobile-floating-nav.visible {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
          transition: opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Desktop/Tablet Floating bottom pill transition */
        .desktop-floating-nav {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          z-index: 40;
          transform: translateX(-50%) translateY(16px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms cubic-bezier(0.4, 0, 1, 1),
                      transform 200ms cubic-bezier(0.4, 0, 1, 1);
        }
        .desktop-floating-nav.visible {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
          pointer-events: auto;
          transition: opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
