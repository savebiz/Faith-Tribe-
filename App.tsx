import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GeminiAssistant from './components/GeminiAssistant';
import { KidsInviteModal } from './components/KidsInviteModal';
import ContentSection from './components/ContentSection';
import LiveStreamPlayer from './components/LiveStreamPlayer';
import { Audience, ContentItem, StaffMember } from './types';
import {
  ArrowRight, Star, Zap, BookOpen, Users, Heart, Share2, X, Lock, Radio,
  Smile, Shield, Calendar, ChevronRight, Plus, CheckCircle2, ClipboardList,
  Send, Sparkles, Trophy, PlusCircle, Check, Instagram, Facebook, Youtube, Flame, Play
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { VerseOfTheWeek } from './lib/bible/VerseOfTheWeek';
import { BibleReaderView } from './lib/bible/BibleReaderView';
import { StudyNote } from './components/StudyNote';
import { parseScriptureReference } from './lib/bible/bookCodes';
import { getCurriculumCache, saveCurriculumCache, fetchCustomVerse, updateCustomVerse, fetchStudyNotesForChapter, signInStaff, signOutStaff, getCurrentStaff, fetchBroadcastStatus, fetchContentItems, supabase } from './lib/supabase';
import { WEEKLY_FUN_ITEMS, WeeklyFunItem } from './lib/weeklyFunConfig';
import { WeeklyFunModal } from './components/WeeklyFunModal';
import { AdminLayout } from './components/AdminLayout';

// --- Mock Data ---
const KIDS_CONTENT: ContentItem[] = [
  { id: '1', title: 'Meet Your New Best Friend', description: 'Who is Jesus and why does He love you so much?', thumbnail: 'https://picsum.photos/seed/jesuslove/400/250', type: 'VIDEO', duration: '5:24' },
  { id: '2', title: 'David and Goliath: Tiny Courage', description: 'Learn how David faced the giant with God\'s help!', thumbnail: 'https://picsum.photos/seed/david/400/250', type: 'VIDEO', duration: '6:12' },
  { id: '3', title: 'The ABCs of Salvation', description: 'A fun activity to learn how to ask Jesus into your heart.', thumbnail: 'https://picsum.photos/seed/abc/400/250', type: 'ACTIVITY', duration: 'Activity PDF' },
];

const TEENS_CONTENT: ContentItem[] = [
  { id: '4', title: 'Why Faith? Why Now?', description: 'Is God real? A real talk for skeptics and seekers.', thumbnail: 'https://picsum.photos/seed/skeptic/400/250', type: 'VIDEO', duration: '12:45' },
  { id: '5', title: 'How to Share Without Being Cringe', description: 'Practical tips on inviting friends to Faith Tribe.', thumbnail: 'https://picsum.photos/seed/share/400/250', type: 'ARTICLE', duration: '4 min read' },
  { id: '6', title: 'My Salvation Story', description: 'Community members share how they found purpose.', thumbnail: 'https://picsum.photos/seed/testimony/400/250', type: 'VIDEO', duration: '8:30' },
];

const TEACHERS_CONTENT: ContentItem[] = [
  { id: '7', title: 'The Art of the Altar Call', description: 'How to lead children to Christ effectively.', thumbnail: 'https://picsum.photos/seed/altar/400/250', type: 'ARTICLE', duration: '8 min read' },
  { id: '8', title: 'Q3 Curriculum: The Great Commission', description: '12-week plan focused on outreach and evangelism.', thumbnail: 'https://picsum.photos/seed/plan/400/250', type: 'LESSON_PLAN', duration: 'Curriculum' },
  { id: '9', title: 'Follow-Up Guide', description: 'What to do in the first 24 hours after a child gets saved.', thumbnail: 'https://picsum.photos/seed/followup/400/250', type: 'LESSON_PLAN', duration: 'Checklist' },
];

interface NewConvert {
  name: string;
  age: string;
  decisionDate: string;
  notes: string;
}

const App: React.FC = () => {
  // Custom router helper (Part A2)
  const getInitialViewAndParams = (): { view: Audience; book: string; chapter: string; versionId: number | null } => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const versionParam = searchParams.get('version');
    const versionId = versionParam ? Number(versionParam) : null;

    if (path.startsWith('/about')) {
      return { view: Audience.ABOUT, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/kids')) {
      localStorage.setItem('ft_current_zone', 'kids');
      return { view: Audience.KIDS, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/teens')) {
      localStorage.setItem('ft_current_zone', 'teens');
      return { view: Audience.TEENS, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/teachers')) {
      localStorage.setItem('ft_current_zone', 'teachers');
      return { view: Audience.TEACHERS, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/admin')) {
      return { view: Audience.ADMIN, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/bible')) {
      const match = path.match(/^\/bible\/([A-Za-z0-9]+)\/([0-9]+)/);
      if (match) {
        return { view: Audience.BIBLE, book: match[1].toUpperCase(), chapter: match[2], versionId };
      }
      return { view: Audience.BIBLE, book: 'GEN', chapter: '1', versionId };
    }
    return { view: Audience.HOME, book: 'GEN', chapter: '1', versionId };
  };

  const initial = getInitialViewAndParams();
  const [currentView, setCurrentView] = useState<Audience>(initial.view);

  const navigateToView = (view: Audience) => {
    let path = '/';
    if (view === Audience.ABOUT) path = '/about';
    else if (view === Audience.KIDS) {
      path = '/kids';
      localStorage.setItem('ft_current_zone', 'kids');
    }
    else if (view === Audience.TEENS) {
      path = '/teens';
      localStorage.setItem('ft_current_zone', 'teens');
    }
    else if (view === Audience.TEACHERS) {
      path = '/teachers';
      localStorage.setItem('ft_current_zone', 'teachers');
    }
    else if (view === Audience.ADMIN) {
      const currentPath = window.location.pathname;
      path = currentPath.startsWith('/admin') ? currentPath : '/admin';
    } else if (view === Audience.BIBLE) {
      const savedVersion = localStorage.getItem('yv_version_id');
      const versionToUse = savedVersion ? Number(savedVersion) : 3034;
      const currentPath = window.location.pathname;
      const match = currentPath.match(/^\/bible\/([A-Za-z0-9]+)\/([0-9]+)/);
      const book = match ? match[1].toUpperCase() : 'GEN';
      const chapter = match ? match[2] : '1';
      path = `/bible/${book}/${chapter}?version=${versionToUse}`;
    }

    if (window.location.pathname !== path || (view === Audience.BIBLE && !window.location.search.includes('version='))) {
      window.history.pushState(null, '', path);
    }
    setCurrentView(view);
  };

  useEffect(() => {
    const handlePopState = () => {
      const current = getInitialViewAndParams();
      setCurrentView(current.view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // -- State for Live Stream Status (conditional UI) --
  const [dbError, setDbError] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState({
    isLive: false,
    title: "",
    watchUrl: "",
    heroVideoUrl: "",
    heroImageUrl: ""
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await fetchBroadcastStatus();
        const newIsLive = !!data.is_live;
        const newTitle = data.title || "";
        const newUrl = data.url || "";
        const newVideoUrl = data.hero_video_url || "";
        const newImageUrl = data.hero_image_url || "";
        
        setBroadcastStatus(prev => {
          if (prev.isLive === newIsLive && 
              prev.title === newTitle && 
              prev.watchUrl === newUrl && 
              prev.heroVideoUrl === newVideoUrl && 
              prev.heroImageUrl === newImageUrl) {
            return prev; // Prevent unnecessary re-render
          }
          return {
            isLive: newIsLive,
            title: newTitle,
            watchUrl: newUrl,
            heroVideoUrl: newVideoUrl,
            heroImageUrl: newImageUrl
          };
        });
      } catch (err: any) {
        console.error("Failed to fetch broadcast status:", err);
        setDbError(err.message || String(err));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // -- State for Prayer Request --
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [prayerRequest, setPrayerRequest] = useState('');

  // -- State for Staff/Admin Authentication --
  const [adminStaff, setAdminStaff] = useState<StaffMember | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // Compute isTeacherLoggedIn dynamically based on active staff member permissions
  const isTeacherLoggedIn = !!adminStaff && [
    'super_admin',
    'teacher_volunteer',
    'zone_manager'
  ].includes(adminStaff.role) && (
    adminStaff.role !== 'zone_manager' || 
    !adminStaff.scoped_zone || 
    adminStaff.scoped_zone === 'teachers'
  );

  // Load active staff session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const staff = await getCurrentStaff();
        setAdminStaff(staff);
      } catch (e) {
        console.error('Failed to load staff session:', e);
      } finally {
        setIsAdminLoading(false);
      }
    };
    loadSession();
  }, []);

  // -- State for Live Stream --
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState(false);

  // -- State for Salvation Guide Modal ("Meet Jesus") --
  const [isSalvationModalOpen, setIsSalvationModalOpen] = useState(false);
  const [salvationStep, setSalvationStep] = useState(1); // 1: Admit, 2: Believe, 3: Confess/Form
  const [salvationName, setSalvationName] = useState('');
  const [salvationEmail, setSalvationEmail] = useState('');
  const [salvationFormSubmitted, setSalvationFormSubmitted] = useState(false);

  // -- State for Teachers Hub Sub-Modals & Trackers --
  const [activeTeacherModal, setActiveTeacherModal] = useState<'convert' | 'decision' | 'schedule' | null>(null);

  // -- State for Real-Time Converts Tracking (Teachers Hub) --
  const [newConverts, setNewConverts] = useState<NewConvert[]>([
    { name: "John Doe", age: "14", decisionDate: "2026-06-28", notes: "First-time decision at Sunday service." },
    { name: "Mary Smith", age: "11", decisionDate: "2026-06-29", notes: "Responded during class altar call." }
  ]);
  const [convertNameInput, setConvertNameInput] = useState('');
  const [convertAgeInput, setConvertAgeInput] = useState('');
  const [convertNotesInput, setConvertNotesInput] = useState('');

  // -- Handlers --
  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Prayer Request Submitted:", prayerRequest);
    toast.success('Your prayer request has been received. Our team will lift you up in prayer! 🙏', {
      duration: 5000,
    });
    setPrayerRequest('');
    setIsPrayerModalOpen(false);
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail.trim() || !teacherPassword.trim()) {
      toast.error('Email and password are required.');
      return;
    }
    try {
      setIsAdminLoading(true);
      const staff = await signInStaff(teacherEmail, teacherPassword);
      
      // Verify role is authorized to view teachers hub
      const canAccessTeachers = ['super_admin', 'teacher_volunteer', 'zone_manager'].includes(staff.role) && (
        staff.role !== 'zone_manager' || !staff.scoped_zone || staff.scoped_zone === 'teachers'
      );
      
      if (!canAccessTeachers) {
        throw new Error('Your role does not grant access to the Teachers Hub.');
      }
      
      setAdminStaff(staff);
      toast.success(`Welcome back, ${staff.full_name}!`);
    } catch (e: any) {
      toast.error(e.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleAdminSignOut = async () => {
    try {
      setIsAdminLoading(true);
      await signOutStaff();
      setAdminStaff(null);
      toast.success('Signed out successfully.');
      navigateToView(Audience.HOME);
    } catch (e: any) {
      toast.error('Failed to sign out.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleSalvationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvationFormSubmitted(true);
    // Add to converts tracker dynamically if name is filled
    if (salvationName) {
      const today = new Date().toISOString().split('T')[0];
      const newDecision: NewConvert = {
        name: salvationName,
        age: "Teens/Youth",
        decisionDate: today,
        notes: "Online decision card submission."
      };
      setNewConverts(prev => [newDecision, ...prev]);
    }
  };

  const resetSalvationModal = () => {
    setIsSalvationModalOpen(false);
    setSalvationStep(1);
    setSalvationName('');
    setSalvationEmail('');
    setSalvationFormSubmitted(false);
  };

  const handleAddConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertNameInput.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const item: NewConvert = {
      name: convertNameInput,
      age: convertAgeInput || "Unknown",
      decisionDate: today,
      notes: convertNotesInput || "Registered manually"
    };

    setNewConverts(prev => [item, ...prev]);
    setConvertNameInput('');
    setConvertAgeInput('');
    setConvertNotesInput('');
  };

  // --- Views ---

  const HomeView = () => (
    <div className="mesh-gradient min-h-screen text-gray-900">
      {/* Live Stream Banner */}
      {broadcastStatus.isLive && (
        <div
          className="bg-[#EE3135] text-white px-4 py-2 flex justify-between items-center sm:px-6 lg:px-8 cursor-pointer hover:bg-[#d62529] transition-colors z-10"
          onClick={() => window.open(broadcastStatus.watchUrl, '_blank')}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2 bg-white rounded-full"></span>
            <p className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">
              LIVE NOW: {broadcastStatus.title}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(broadcastStatus.watchUrl, '_blank');
            }}
            className="text-[10px] bg-white text-[#EE3135] hover:bg-red-50 px-3.5 py-1 rounded-full font-black tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            WATCH LIVE
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-6 sm:pb-20 sm:pt-10 lg:px-8 lg:pt-14 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
          <div className="w-full">
            <h1 className="text-4xl font-black tracking-tight text-[#372f58] sm:text-6xl leading-tight">
              Faith Tribe
              <span className="text-[#1CABB9] block text-2xl sm:text-3xl font-extrabold mt-3 tracking-wide">
                Win Souls. Raise Champions.
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#372f58]/85">
              The digital heartbeat for our children and teenagers. A vibrant space to encounter the presence of God, grow strong in faith, and lead peers into Christ's brilliant light.
            </p>

            <div className="mt-8 flex flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsSalvationModalOpen(true)}
                className="w-auto rounded-full bg-[#372f58] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#372f58]/10 hover:bg-[#1CABB9] hover:text-[#372f58] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#372f58] text-center"
              >
                Meet Jesus
              </button>
              <a
                href="#discipleship-tracks"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('discipleship-tracks')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-auto rounded-full bg-[#F8B229] px-6 py-3 text-sm font-bold text-[#372f58] shadow-lg shadow-[#F8B229]/15 hover:bg-[#1CABB9] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#F8B229] text-center"
              >
                Explore Tribes
              </a>
            </div>
          </div>
          <div className="w-full flex justify-center lg:justify-end mt-6 sm:mt-12 lg:mt-0">
            <div className="w-full max-w-md sm:max-w-lg p-3 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-2xl flex">
              <video
                key={`${broadcastStatus.heroVideoUrl}-${broadcastStatus.heroImageUrl}`}
                autoPlay
                muted
                loop
                playsInline
                poster={broadcastStatus.heroImageUrl || "/faith-tribe-hero-poster-1080.jpg"}
                className="w-full aspect-[4/3] rounded-[2rem] shadow-xl object-cover"
                aria-hidden="true"
              >
                {broadcastStatus.heroVideoUrl ? (
                  <source src={broadcastStatus.heroVideoUrl} />
                ) : (
                  <>
                    <source src="/faith-tribe-hero-w.webm" type="video/webm" />
                    <source src="/faith-tribe-hero.mp4" type="video/mp4" />
                  </>
                )}
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* Soul Winning Block */}
      <div className="bg-gradient-to-r from-[#372f58] to-[#1CABB9] py-16 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl pointer-events-none"></div>
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl mb-4">
            Looking for Purpose and Peace?
          </h2>
          <p className="text-white/90 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Whether you grew up in church or are seeking answers for the very first time, Jesus invites you to a life filled with purpose, freedom, and divine support.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => { setIsSalvationModalOpen(true); setSalvationStep(1); }}
              className="bg-white text-[#372f58] px-6 py-3 rounded-full font-bold hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Start Salvation Guide
            </button>
            <button
              onClick={() => setIsPrayerModalOpen(true)}
              className="bg-transparent border-2 border-white/80 text-white px-6 py-3 rounded-full font-bold hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Request Prayer Support
            </button>
          </div>
        </div>
      </div>

      {/* Audience Selection Grid */}
      <div id="discipleship-tracks" className="py-24 bg-white/30 backdrop-blur-md border-t border-teal-100/50" style={{ scrollMarginTop: '80px' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-xs font-bold leading-7 text-[#1CABB9] uppercase tracking-widest">Discipleship Tracks</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#372f58] sm:text-4xl">
              Find Your Place in the Tribe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Kids Card */}
            <div
              onClick={() => navigateToView(Audience.KIDS)}
              className="group bg-white/70 backdrop-blur-sm border-2 border-amber-100/60 p-8 rounded-3xl cursor-pointer hover:bg-amber-50/50 hover:border-amber-300 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 relative"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-amber-400 text-white shadow-md shadow-amber-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-6 w-6 fill-current" />
              </div>
              <h3 className="font-display font-bold text-2xl text-amber-700 mb-2">
                Faith Tribe Kids (2-12)
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Exciting Bible stories, sing-alongs, and fun activities designed to introduce young hearts to Jesus's love.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Enter Zone</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Teens Card */}
            <div
              onClick={() => navigateToView(Audience.TEENS)}
              className="group bg-white/70 backdrop-blur-sm border border-[#1CABB9]/20 p-8 rounded-3xl cursor-pointer hover:bg-[#1CABB9]/5 hover:border-[#1CABB9] transition-all duration-300 hover:shadow-xl hover:shadow-[#1CABB9]/5 relative"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#372f58] text-white shadow-md shadow-[#372f58]/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 fill-current" />
              </div>
              <h3 className="font-sans font-black text-xl text-[#372f58] mb-2">
                Faith Tribe Teens (13-15)
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                A community to discuss life, navigate questions honestly, find solid truth, and share Christ confidently.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1CABB9] group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Join Tribe</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Teachers Card */}
            <div
              onClick={() => navigateToView(Audience.TEACHERS)}
              className="group bg-white/70 backdrop-blur-sm border border-teal-100 p-8 rounded-3xl cursor-pointer hover:bg-teal-50/50 hover:border-teal-300 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5 relative"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-sans font-black text-xl text-teal-800 mb-2">
                Faith Tribe Teachers
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Curriculums, tracking dashboards, follow-up modules, and spiritual resources to lead classes effectively.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-teal-600 group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Access Hub</span>
                <ChevronRight size={14} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  const AboutView = () => (
    <div className="mesh-gradient min-h-screen text-gray-900 pb-20">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
        <h2 className="text-xs font-bold leading-7 text-[#1CABB9] uppercase tracking-widest mb-3">
          ABOUT FAITH TRIBE
        </h2>
        <h1 className="text-4xl font-black tracking-tight text-[#372f58] sm:text-5xl leading-tight">
          Empowering the Next Generation <br className="hidden sm:inline" />Through Faith
        </h1>
      </div>

      {/* Who We Are & Story */}
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-stretch items-start">
        {/* Left Column: Who We Are & Sub-ministries */}
        <div className="lg:col-span-7 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/50 shadow-sm flex flex-col h-full">
          <h2 className="text-2xl font-black text-[#372f58] mb-4">Who We Are</h2>
          <p className="text-sm leading-relaxed text-[#372f58]/85 mb-6">
            Faith Tribe is the Junior Church of RCCG Region 63 — a single, unified identity for everything we do with children and teenagers across the region. Under one name, Faith Tribe brings together three ministries with one shared purpose:
          </p>

          {/* Simplified Editorial Sub-ministries list */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-[#1CABB9]/5 transition-colors duration-200">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mt-0.5">
                <Star size={16} className="fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#372f58]">Faith Tribe Kids</h4>
                <p className="text-xs text-gray-600 mt-0.5">Our children's ministry, serving ages 2 to 12.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-[#1CABB9]/5 transition-colors duration-200">
              <div className="h-8 w-8 rounded-lg bg-[#372f58]/10 flex items-center justify-center text-[#372f58] mt-0.5">
                <Zap size={16} className="fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#372f58]">Faith Tribe Teens</h4>
                <p className="text-xs text-gray-600 mt-0.5">Our teenagers' ministry, serving ages 13 to 15.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-[#1CABB9]/5 transition-colors duration-200">
              <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 mt-0.5">
                <BookOpen size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#372f58]">Faith Tribe Teachers</h4>
                <p className="text-xs text-gray-600 mt-0.5">The dedicated team who leads and disciples them both.</p>
              </div>
            </div>
          </div>

          <p className="text-sm font-bold text-[#372f58] mt-auto border-t border-gray-100 pt-4 text-center sm:text-left">
            We are one tribe, made up of different ages and roles, united by the same faith and the same mission: raising a generation rooted in Christ.
          </p>
        </div>

        {/* Right Column: Logo Story */}
        <div className="lg:col-span-5 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/50 shadow-sm flex flex-col items-center text-center h-full">
          <img
            src="/Faith_Tribe_Circular.png"
            alt="Faith Tribe Circular Emblem"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full border border-[#372f58]/10 shadow-lg mb-6"
          />
          <h3 className="text-xl font-black text-[#372f58] mb-3">The Story Behind Our Name and Logo</h3>
          <p className="text-xs leading-relaxed text-[#372f58]/80 text-justify">
            The name "Faith Tribe" reflects who we are becoming — a connected community united by faith, bringing together the diverse, vibrant family of children, teenagers, and teachers across Region 63.
          </p>
          <p className="text-xs leading-relaxed text-[#372f58]/80 text-justify mt-3">
            Our logo tells that story visually. At its center is a growing tree, its branches quietly forming the shape of a flame — a picture of the Holy Spirit's guidance, and of growth that never stops. Woven into the tree are small human figures, standing in as leaves and roots: children, teenagers, and teachers, each one valued, each one growing together as part of the same tree. At the core of it all is a light — a reminder that everything we do is centered on Christ. The tree itself is the whole point: faith isn't a single moment, it's a lifelong journey, and we're walking it together.
          </p>
        </div>
      </div>

      {/* Vision & Mission (side by side on desktop, stacked on mobile) */}
      <div className="mx-auto max-w-7xl px-6 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vision Block */}
        <div className="bg-gradient-to-br from-[#372f58]/5 to-white/60 border border-white/40 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#1CABB9]/10 rounded-full filter blur-xl pointer-events-none"></div>
          <h3 className="text-xs font-bold text-[#1CABB9] uppercase tracking-widest mb-2">OUR VISION</h3>
          <h4 className="text-xl font-black text-[#372f58] mb-3">A Welcoming Discipleship Space</h4>
          <p className="text-sm leading-relaxed text-[#372f58]/85">
            To cultivate a vibrant, welcoming community where children and teenagers grow in faith, develop strong relationships, and become empowered to live out the teachings of Christ in their everyday lives. We envision a space where every young person feels valued, inspired to explore their faith, and equipped to serve others — fostering a lifelong journey of love, compassion, and discipleship.
          </p>
        </div>

        {/* Mission Block */}
        <div className="bg-gradient-to-br from-[#1CABB9]/5 to-white/60 border border-white/40 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F8B229]/10 rounded-full filter blur-xl pointer-events-none"></div>
          <h3 className="text-xs font-bold text-[#1CABB9] uppercase tracking-widest mb-2">OUR MISSION</h3>
          <h4 className="text-xl font-black text-[#372f58] mb-3">Nurture and Disciple</h4>
          <p className="text-sm leading-relaxed text-[#372f58]/85">
            To nurture and disciple children and teenagers through Christ-centered teaching, purposeful mentorship, and meaningful fellowship. We aim to equip them with spiritual strength, moral integrity, and leadership skills to live out their faith boldly and impact their communities for Christ.
          </p>
        </div>
      </div>

      {/* What We're Building Toward (3 priorities) */}
      <div className="mx-auto max-w-7xl px-6 mt-16">
        <div className="text-center mb-10">
          <h3 className="text-xs font-bold text-[#1CABB9] uppercase tracking-widest mb-2">OUR FUTURE</h3>
          <h2 className="text-3xl font-black text-[#372f58]">What We're Building Toward</h2>
          <p className="text-sm text-gray-500 mt-2">Three priorities guide the construction of the Faith Tribe digital environment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/40 border border-white/30 p-6 rounded-2xl hover:bg-white/60 transition-colors duration-200">
            <div className="h-2 w-12 bg-[#F8B229] rounded-full mb-4" />
            <h4 className="font-bold text-base text-[#372f58] mb-2">Capacity Building & Expansion</h4>
            <p className="text-xs leading-relaxed text-gray-600">
              Growing our team and reaching more parishes, so every child and teenager in Region 63 has access to a Junior Church, not just some of them.
            </p>
          </div>
          <div className="bg-white/40 border border-white/30 p-6 rounded-2xl hover:bg-white/60 transition-colors duration-200">
            <div className="h-2 w-12 bg-[#1CABB9] rounded-full mb-4" />
            <h4 className="font-bold text-base text-[#372f58] mb-2">Infrastructure & Welfare</h4>
            <p className="text-xs leading-relaxed text-gray-600">
              Strengthening the everyday experience of being part of Faith Tribe: better facilities, better support, better care during conventions, camps, and regular programming.
            </p>
          </div>
          <div className="bg-white/40 border border-white/30 p-6 rounded-2xl hover:bg-white/60 transition-colors duration-200">
            <div className="h-2 w-12 bg-[#372f58] rounded-full mb-4" />
            <h4 className="font-bold text-base text-[#372f58] mb-2">Innovative Programming & Engagement</h4>
            <p className="text-xs leading-relaxed text-gray-600">
              Creative, relevant events and formats that meet teenagers and children where they are, and hold their attention long enough to change their lives.
            </p>
          </div>
        </div>
      </div>

      {/* Closing CTA row */}
      <div className="mx-auto max-w-4xl px-6 mt-20 text-center border-t border-gray-150 pt-16">
        <h2 className="text-3xl font-black text-[#372f58] mb-4">Join the Tribe</h2>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Whether you're a child taking your first steps in faith, a teenager navigating real questions with real stakes, or a teacher called to shape the next generation — there's a place for you here.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => navigateToView(Audience.KIDS)}
            className="w-full sm:w-auto rounded-full bg-[#F8B229] px-6 py-3 text-sm font-bold text-[#372f58] shadow-md hover:bg-[#1CABB9] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#F8B229]"
          >
            Enter Zone — Faith Tribe Kids
          </button>
          <button
            onClick={() => navigateToView(Audience.TEENS)}
            className="w-full sm:w-auto rounded-full bg-[#1CABB9] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#372f58] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#1CABB9]"
          >
            Join Tribe — Faith Tribe Teens
          </button>
          <button
            onClick={() => navigateToView(Audience.TEACHERS)}
            className="w-full sm:w-auto rounded-full bg-[#372f58] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#1CABB9] hover:text-[#372f58] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#372f58]"
          >
            Access Hub — Faith Tribe Teachers
          </button>
        </div>
      </div>
    </div>
  );

  const KidsView = () => {
    const [selectedWeeklyFunItem, setSelectedWeeklyFunItem] = useState<WeeklyFunItem | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [kidsStreak, setKidsStreak] = useState(() => {
      const saved = localStorage.getItem('ft_bible_streak');
      return saved ? Number(saved) : 0;
    });
    const [weeklyFunItems, setWeeklyFunItems] = useState<WeeklyFunItem[]>(WEEKLY_FUN_ITEMS);

    useEffect(() => {
      async function loadKidsContent() {
        try {
          const dbItems = await fetchContentItems('kids', undefined, 'published');
          if (dbItems && dbItems.length > 0) {
            const mapped: WeeklyFunItem[] = dbItems.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              thumbnailUrl: item.thumbnail_url || 'https://picsum.photos/seed/jesuslove/400/250',
              type: item.type as any,
              duration: item.duration || '',
              youtubeVideoId: item.video_id || '',
              videoSource: item.video_source as any || 'youtube',
              storyContent: item.story_content || '',
              writingPrompt: item.writing_prompt || '',
              coloringImageUrl: item.coloring_image_url || '',
              documentUrl: item.document_url || ''
            }));
            setWeeklyFunItems(mapped);
          }
        } catch (err: any) {
          console.error('Failed to fetch kids content:', err);
          setDbError(err.message || String(err));
        }
      }
      loadKidsContent();
    }, []);

    return (
      <div className="mesh-gradient-kids min-h-screen pb-16 font-display">
        {/* Kids Header */}
        <div className="bg-amber-400 p-10 rounded-b-[3.5rem] shadow-xl text-center relative overflow-hidden border-b-4 border-amber-500">
          <div className="absolute inset-0 bg-white/5 pointer-events-none">
            <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="15" cy="20" r="12" fill="white" />
              <circle cx="85" cy="75" r="16" fill="white" />
              <path d="M50,10 L60,30 L80,20 L65,45 L50,10" fill="white" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-6xl text-white font-extrabold drop-shadow-md mb-2 flex items-center justify-center gap-2">
            <Smile className="animate-bounce" size={40} />
            <span>Faith Kids!</span>
          </h1>
          <p className="text-amber-100 text-lg font-bold tracking-wide">
            Jesus wants to be your forever friend!
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Bring a Friend ticket/card design */}
            <div className="kids-ticket p-6 shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="bg-amber-100 p-3 rounded-full text-amber-500">
                  <Heart size={28} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-amber-700">Invite Your Best Buddies!</h3>
                  <p className="text-sm font-sans font-medium text-gray-500 mt-0.5">
                    Share the fun videos and learn together. Jesus has love for everyone!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-5 py-2.5 bg-amber-400 text-white font-black rounded-2xl hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-200 cursor-pointer text-sm shrink-0 border-b-4 border-amber-500"
              >
                Get Invite Card
              </button>
            </div>

            {/* This Week's Fun Section */}
            <div className="py-6">
              <h2 className="text-2xl font-black mb-6 tracking-tight text-amber-500 flex items-center gap-2 font-display text-left">
                <span className="w-1.5 h-6 rounded-full bg-amber-400 opacity-70"></span>
                This Week's Fun
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {weeklyFunItems.map((item) => {
                  const badgeText = item.type === 'video' ? 'Watch Video' : item.type === 'reading' ? 'Read Story' : item.type === 'writing' ? 'Writing Activity' : 'Coloring Paint';
                  const badgeClass = item.type === 'video' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : item.type === 'reading' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : item.type === 'writing' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' : 'bg-teal-500/10 text-teal-600 border border-teal-500/20';
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedWeeklyFunItem(item)}
                      className="group overflow-hidden cursor-pointer transition-all duration-300 rounded-3xl bg-white border-2 border-amber-100 hover-bounce shadow-sm text-gray-900 flex flex-col justify-between"
                    >
                      <div className="relative h-44 overflow-hidden bg-gray-100">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          {item.type === 'video' && (
                            <div className="bg-white text-gray-900 p-3.5 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                              <Play size={20} fill="currentColor" className="ml-0.5" />
                            </div>
                          )}
                        </div>
                        {item.duration && (
                          <span className="absolute bottom-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md bg-black/60 text-white">
                            {item.duration}
                          </span>
                        )}
                      </div>
                      <div className="p-5 text-left flex-1 flex flex-col justify-between">
                        <div>
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3 ${badgeClass}`}>
                            {badgeText}
                          </span>
                          <h3 className="font-bold text-lg mb-1.5 line-clamp-2 text-gray-900 font-display group-hover:text-amber-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Bible Verse Spotlight */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-amber-200/60 relative overflow-hidden text-gray-700">
              {kidsStreak > 0 && (
                <div className="absolute top-0 right-0 p-3 bg-amber-400 text-white rounded-bl-2xl flex items-center gap-1">
                  <Flame size={16} className="fill-white animate-pulse" />
                  <span className="text-xs font-black tracking-wide">{kidsStreak} Streak</span>
                </div>
              )}
              <h3 className="text-2xl text-amber-600 mb-4 text-left font-sans font-bold">Verse of the Day</h3>
              <VerseOfTheWeek versionId={2079} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GeminiAssistant audience={Audience.KIDS} />
            </div>
          </div>
        </div>

        {/* Weekly Fun Modal */}
        <WeeklyFunModal 
          item={selectedWeeklyFunItem} 
          onClose={() => setSelectedWeeklyFunItem(null)} 
        />
        <KidsInviteModal 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
        />
      </div>
    );
  };

  const TeensView = () => (
    <div className="mesh-gradient-teens min-h-screen text-gray-100 pb-16">
      {/* Teens Header Banner */}
      <div className="relative h-72 overflow-hidden border-b border-gray-800">
        <img
          src="https://picsum.photos/seed/teens/1200/400"
          className="w-full h-full object-cover opacity-25 filter grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-8 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-md">
                <Sparkles size={12} />
                <span>Identity & Hope</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
                Faith Teens
              </h1>
              <p className="text-gray-400 mt-2.5 text-base sm:text-lg max-w-md">
                Genuine questions. Real faith. No performance, just raw truth.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).catch(() => { });
                toast.success('Invite link copied to clipboard! Share with your friends. 🔗', { duration: 4000 });
              }}
              className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-gray-950 px-5 py-2.5 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <Share2 size={16} /> Invite Friends
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Monthly Topic Featured Panel */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/80 border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl"></div>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-emerald-400">
              <Zap className="text-yellow-400" /> Topic of the Month
            </h2>
            <p className="text-2xl font-black text-white">"Identity in a Filtered World"</p>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
              Who are you when the screen is turned off? Learn how Christ defines your worth, potential, and future far beyond likes and comments.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => toast('Loading sermon video... 🎬', { duration: 3000 })}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-lg text-sm font-bold transition-all hover:scale-102 cursor-pointer"
              >
                Watch Message
              </button>
              <button
                onClick={() => setIsPrayerModalOpen(true)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-sm font-bold transition-all hover:scale-102 cursor-pointer"
              >
                Need Advice / Prayer?
              </button>
            </div>
          </div>

          <ContentSection title="Latest Drops" items={TEENS_CONTENT} colorTheme="text-emerald-400" />

          {/* Bible Verse Spotlight */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-emerald-200/60 relative overflow-hidden text-gray-700 animate-in fade-in duration-300">
            <div className="absolute top-0 right-0 p-3 bg-emerald-400 text-white rounded-bl-2xl">
              <Trophy size={18} />
            </div>
            <h3 className="text-2xl text-emerald-600 mb-4 font-sans font-bold">Verse of the Day</h3>
            <VerseOfTheWeek versionId={1588} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <GeminiAssistant audience={Audience.TEENS} />
          </div>
        </div>
      </div>
    </div>
  );

  const TeachersView = () => {
    const [curriculumTrack, setCurriculumTrack] = useState<'kids' | 'teens'>('kids');
    const [liveLessons, setLiveLessons] = useState<any[]>([]);
    const [isLoadingLive, setIsLoadingLive] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const [flags, setFlags] = useState({ enableCurriculumPhase1: true, enableCurriculumPhase2: true });

    // Study Notes states for lesson prep
    const [studyNotesQuery, setStudyNotesQuery] = useState('');
    const [studyNotesResults, setStudyNotesResults] = useState<any[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [studyNotesSearched, setStudyNotesSearched] = useState(false);

    const handleSearchStudyNotes = async (e: React.FormEvent) => {
      e.preventDefault();
      const q = studyNotesQuery.trim();
      if (!q) return;

      setIsLoadingNotes(true);
      setStudyNotesSearched(true);
      try {
        const parsed = parseScriptureReference(q);
        if (!parsed) {
          toast.error("Invalid scripture format. Use e.g. 'John 3:16' or 'Luke 15'", { duration: 4000 });
          setStudyNotesResults([]);
          return;
        }

        const allNotes = await fetchStudyNotesForChapter(parsed.bookCode, parsed.chapter);
        
        // Filter further if verse is specified (e.g. John 3:16 -> filter notes matching usfm_start === "JHN 3:16" or containing JHN 3:16)
        if (parsed.verse !== null) {
          const expectedStart = `${parsed.bookCode} ${parsed.chapter}:${parsed.verse}`;
          const filtered = allNotes.filter(note => {
            if (!note.usfm_start) return false;
            if (note.usfm_start === expectedStart) return true;
            if (note.usfm_start.startsWith(expectedStart + '-')) return true;
            const rangeMatch = note.usfm_start.match(/^([1-3]?\s*[A-Z]+)\s*(\d+):(\d+)(?:-(\d+):?(\d+)?)?/);
            if (rangeMatch) {
              const startV = Number(rangeMatch[3]);
              const endV = rangeMatch[5] ? Number(rangeMatch[5]) : rangeMatch[4] ? Number(rangeMatch[4]) : startV;
              return parsed.verse >= startV && parsed.verse <= endV;
            }
            return false;
          });
          setStudyNotesResults(filtered);
        } else {
          setStudyNotesResults(allNotes);
        }
      } catch (err) {
        console.error('Error loading study notes for teacher:', err);
        toast.error('Failed to load study notes.');
      } finally {
        setIsLoadingNotes(false);
      }
    };

    // Scripture Admin Override States
    const [customVerseInput, setCustomVerseInput] = useState('');
    const [isSavingCustomVerse, setIsSavingCustomVerse] = useState(false);

    useEffect(() => {
      const loadCurrentCustom = async () => {
        try {
          const current = await fetchCustomVerse();
          if (current) {
            setCustomVerseInput(current);
          }
        } catch (err) {
          console.warn("Failed to load current custom verse override:", err);
        }
      };
      if (isTeacherLoggedIn) {
        loadCurrentCustom();
      }
    }, [isTeacherLoggedIn]);

    const handleSaveCustomVerse = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!customVerseInput.trim()) return;

      setIsSavingCustomVerse(true);
      try {
        await updateCustomVerse(customVerseInput.trim());
        toast.success('Verse of the Day updated! ✨ Check the homepage spotlight card to see the changes.', { duration: 5000 });
      } catch (err) {
        console.error(err);
        toast.error('Failed to update custom verse. Please try again.');
      } finally {
        setIsSavingCustomVerse(false);
      }
    };

    useEffect(() => {
      const fetchFlagsAndCurriculum = async () => {
        setIsLoadingLive(true);
        let activeFlags = {
          enableCurriculumPhase1: true,
          enableCurriculumPhase2: true,
          lessonsApiBaseUrl: 'https://api.lessons.church',
          lessonsApiKey: ''
        };

        try {
          const res = await fetch('/feature_flags.json');
          if (res.ok) {
            const data = await res.json();
            activeFlags = data;
            setFlags(data);
          }
        } catch (err) {
          console.warn("Failed to load feature flags, using defaults:", err);
        }

        try {
          const cached = await getCurriculumCache();
          if (cached && cached.length > 0) {
            setLiveLessons(cached);
            setIsLoadingLive(false);
            setUseFallback(false);
            return;
          }

          const apiBase = activeFlags.lessonsApiBaseUrl || 'https://api.lessons.church';
          const apiKey = activeFlags.lessonsApiKey || import.meta.env.VITE_LESSONS_API_KEY || '';

          const headers: Record<string, string> = {};
          if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
          }

          const response = await fetch(`${apiBase}/programs/public`, { headers });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setLiveLessons(data);
              await saveCurriculumCache(data);
              setUseFallback(false);
            } else {
              throw new Error("Invalid lessons payload");
            }
          } else {
            throw new Error(`HTTP error: ${response.status}`);
          }
        } catch (err) {
          console.warn("LessonsApi fetch failed, using Phase 1 fallback:", err);
          setUseFallback(true);
        } finally {
          setIsLoadingLive(false);
        }
      };

      if (isTeacherLoggedIn) {
        fetchFlagsAndCurriculum();
      }
    }, [isTeacherLoggedIn]);

    // -- Login Gate --
    if (!isTeacherLoggedIn) return null;

    // -- Bento Grid Dashboard for Teachers --
    return (
      <div className="bg-gray-50 min-h-screen pb-16 text-gray-800">
        <div className="bg-white border-b border-gray-150 py-8 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Teachers Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Equipping region leaders to save souls and grow conversions.</p>
            </div>
            <button
              onClick={handleAdminSignOut}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4.5 py-2 rounded-full border border-red-200/60 transition-colors"
            >
              Sign Out Hub
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Bento grids) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Bento Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Tracker Widget Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-teal-100 flex items-center gap-2">
                      <Trophy size={18} /> Sunday Class Goal
                    </h3>
                    <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                  </div>
                  <h4 className="text-2xl font-black mt-4">Evangelism Focus</h4>
                  <p className="text-sm text-teal-100 mt-1">Lead kids to make personal choices for Christ.</p>
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Decisions Target: {newConverts.length}/5 Souls</span>
                    <span>{Math.min(100, Math.round((newConverts.length / 5) * 100))}%</span>
                  </div>
                  <div className="w-full bg-teal-900/60 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (newConverts.length / 5) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Add Convert Mini-form Card */}
              <div className="p-6 rounded-2xl bg-white border border-gray-150 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <PlusCircle size={16} className="text-teal-600" /> Register Decision
                  </h3>
                  <form onSubmit={handleAddConvertSubmit} className="space-y-3">
                    <input
                      type="text"
                      required
                      value={convertNameInput}
                      onChange={e => setConvertNameInput(e.target.value)}
                      placeholder="Convert Name"
                      className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={convertAgeInput}
                        onChange={e => setConvertAgeInput(e.target.value)}
                        placeholder="Age"
                        className="w-1/3 text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                      />
                      <input
                        type="text"
                        value={convertNotesInput}
                        onChange={e => setConvertNotesInput(e.target.value)}
                        placeholder="Class Notes"
                        className="w-2/3 text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-1.5 rounded transition-all cursor-pointer shadow-sm flex justify-center items-center gap-1"
                    >
                      <Plus size={12} /> Add to Tracker
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Quick Links / Submodal Clickers (Bento Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              <div
                onClick={() => setActiveTeacherModal('convert')}
                className="p-5 bg-white border border-gray-150 rounded-2xl cursor-pointer hover:border-teal-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="bg-teal-50 p-3 rounded-full text-teal-600 mb-3"><Users size={20} /></div>
                <h4 className="font-bold text-sm text-gray-900">New Convert Tracker</h4>
                <p className="text-[10px] text-gray-400 mt-1">{newConverts.length} Records registered</p>
              </div>

              <div
                onClick={() => setActiveTeacherModal('decision')}
                className="p-5 bg-white border border-gray-150 rounded-2xl cursor-pointer hover:border-teal-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="bg-teal-50 p-3 rounded-full text-teal-600 mb-3"><ClipboardList size={20} /></div>
                <h4 className="font-bold text-sm text-gray-900">Digital Decision Cards</h4>
                <p className="text-[10px] text-gray-400 mt-1">Review altar responses</p>
              </div>

              <div
                onClick={() => setActiveTeacherModal('schedule')}
                className="p-5 bg-white border border-gray-150 rounded-2xl cursor-pointer hover:border-teal-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="bg-teal-50 p-3 rounded-full text-teal-600 mb-3"><Calendar size={20} /></div>
                <h4 className="font-bold text-sm text-gray-900">Follow-up Scheduler</h4>
                <p className="text-[10px] text-gray-400 mt-1">First 24 hrs checklist</p>
              </div>

            </div>

            {/* Phase 1: Curated Curriculum Library Section (Fallback) */}
            {((flags.enableCurriculumPhase1 && useFallback) || (flags.enableCurriculumPhase1 && !flags.enableCurriculumPhase2)) && (
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-150 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-teal-800 tracking-tight flex items-center gap-2">
                      <BookOpen size={24} className="text-teal-650" /> Curriculum Library
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Curated lesson programs powered by Lessons.church</p>
                  </div>

                  {/* Curriculum Segment Tabs */}
                  <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setCurriculumTrack('kids')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${curriculumTrack === 'kids' ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-655 hover:text-teal-800'}`}
                    >
                      Kids Zone (2-12)
                    </button>
                    <button
                      onClick={() => setCurriculumTrack('teens')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${curriculumTrack === 'teens' ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-655 hover:text-teal-800'}`}
                    >
                      Teens Tribe (13-15)
                    </button>
                  </div>
                </div>

                {/* Curried Curriculum Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {curriculumTrack === 'kids' ? (
                    <>
                      <div className="bg-amber-50/50 hover:bg-amber-50 border border-amber-100 p-5 rounded-2xl transition-all duration-300 hover:shadow-md flex flex-col justify-between h-full group">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">Ages 2–4</span>
                            <span className="text-xs text-gray-400">Preschool</span>
                          </div>
                          <h4 className="font-display font-bold text-lg text-amber-700 group-hover:text-amber-800 transition-colors">Bible App for Kids</h4>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">Interactive storybook lessons helping preschoolers explore early Bible stories, coloring pages, and leader guides.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-600 bg-white border border-amber-200 px-2 py-0.5 rounded">Focus: Love, Obedience</span>
                          <a href="https://lessons.church/curriculums" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-amber-700 hover:underline flex items-center gap-1">Open Lessons &rarr;</a>
                        </div>
                      </div>

                      <div className="bg-teal-50/30 hover:bg-teal-50/60 border border-teal-100 p-5 rounded-2xl transition-all duration-300 hover:shadow-md flex flex-col justify-between h-full group">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-850 rounded-full">Ages 5–7</span>
                            <span className="text-xs text-gray-400">Kindergarten</span>
                          </div>
                          <h4 className="font-sans font-bold text-lg text-teal-850 group-hover:text-teal-900 transition-colors">Crosstown</h4>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">Fun animated adventures exploring key Bible stories, helping kids develop early habits of prayer and sharing.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-teal-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-700 bg-white border border-teal-200 px-2 py-0.5 rounded">Focus: Kindness, Sharing</span>
                          <a href="https://lessons.church/curriculums" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-teal-850 hover:underline flex items-center gap-1">Open Lessons &rarr;</a>
                        </div>
                      </div>

                      <div className="bg-indigo-50/30 hover:bg-indigo-50/60 border border-indigo-100 p-5 rounded-2xl transition-all duration-300 hover:shadow-md flex flex-col justify-between h-full group">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">Ages 8–9</span>
                            <span className="text-xs text-gray-400">Grades 1-4</span>
                          </div>
                          <h4 className="font-sans font-bold text-lg text-indigo-800 group-hover:text-indigo-900 transition-colors">Konnect</h4>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">Fast-paced, video-based space station adventures teaching kids integrity, peer-choice support, and faith principles.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-indigo-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">Focus: Integrity, Choices</span>
                          <a href="https://lessons.church/curriculums" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-indigo-800 hover:underline flex items-center gap-1">Open Lessons &rarr;</a>
                        </div>
                      </div>

                      <div className="bg-purple-50/30 hover:bg-purple-50/60 border border-purple-100 p-5 rounded-2xl transition-all duration-300 hover:shadow-md flex flex-col justify-between h-full group">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">Ages 10–12</span>
                            <span className="text-xs text-gray-400">Grades 5-6</span>
                          </div>
                          <h4 className="font-sans font-bold text-lg text-purple-800 group-hover:text-purple-900 transition-colors">Loop</h4>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">Tailored pre-teen series tackling transitional growth topics, scripture context, and building personal devotions.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-purple-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-700 bg-white border border-purple-200 px-2 py-0.5 rounded">Focus: Devotion, Apologetics</span>
                          <a href="https://lessons.church/curriculums" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-purple-800 hover:underline flex items-center gap-1">Open Lessons &rarr;</a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-1 md:col-span-2 bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-100 p-6 rounded-2xl transition-all duration-300 hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Ages 13–15</span>
                          <span className="text-xs text-gray-400">Junior High</span>
                        </div>
                        <h4 className="font-sans font-black text-xl text-emerald-800 group-hover:text-emerald-900 transition-colors">Switch Youth</h4>
                        <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                          A robust, interactive discipleship curriculum exploring real-world culture, identity in Christ, bold faith expressions, and daily scripture engagement plans.
                        </p>
                        <div className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-0.5 rounded">
                          Focus: Identity, Boldness, Discipleship
                        </div>
                      </div>
                      <a
                        href="https://lessons.church/curriculums"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm text-center whitespace-nowrap cursor-pointer self-stretch md:self-auto flex items-center justify-center gap-1"
                      >
                        Open Switch Lessons &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phase 2: Live API Integration Card Grid */}
            {flags.enableCurriculumPhase2 && !useFallback && (
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-150 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-teal-800 tracking-tight flex items-center gap-2">
                      <BookOpen size={24} className="text-teal-650" /> Curriculum Library
                      <span className="text-[9px] font-black tracking-widest text-[#1CABB9] bg-[#1CABB9]/10 px-2.5 py-0.5 rounded-full border border-[#1CABB9]/25 animate-pulse">LIVE SYNC</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Live programs pulled directly from LessonsApi (Staging)</p>
                  </div>

                  {/* Curriculum Segment Tabs */}
                  <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setCurriculumTrack('kids')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${curriculumTrack === 'kids' ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-655 hover:text-teal-800'}`}
                    >
                      Kids Zone (2-12)
                    </button>
                    <button
                      onClick={() => setCurriculumTrack('teens')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${curriculumTrack === 'teens' ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-655 hover:text-teal-800'}`}
                    >
                      Teens Tribe (13-15)
                    </button>
                  </div>
                </div>

                {isLoadingLive ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
                    <div className="animate-pulse bg-gray-50 border border-gray-100 p-6 rounded-2xl h-44"></div>
                    <div className="animate-pulse bg-gray-50 border border-gray-100 p-6 rounded-2xl h-44"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const filterList = (track: 'kids' | 'teens') => {
                        if (track === 'kids') {
                          return liveLessons.filter(l => {
                            const name = (l.name || '').toLowerCase();
                            const desc = (l.description || '').toLowerCase();
                            return name.includes('kid') || name.includes('junior') || name.includes('preschool') || name.includes('voltage') || name.includes('elementary') || desc.includes('children') || desc.includes('grade');
                          });
                        } else {
                          return liveLessons.filter(l => {
                            const name = (l.name || '').toLowerCase();
                            const desc = (l.description || '').toLowerCase();
                            const isKids = name.includes('kid') || name.includes('junior') || name.includes('preschool') || name.includes('elementary');
                            return !isKids || name.includes('youth') || name.includes('student') || name.includes('story') || name.includes('next') || name.includes('second');
                          });
                        }
                      };

                      const filtered = filterList(curriculumTrack);

                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-1 md:col-span-2 text-center py-8 text-sm text-gray-400 italic">
                            No active live programs matching this age group right now.
                          </div>
                        );
                      }

                      return filtered.map((lesson) => {
                        const targetSlug = lesson.slug || '';
                        const isStagingSlug = targetSlug.endsWith('-staging') || targetSlug === 'second' || targetSlug === 'taras';
                        const fallbackUrl = 'https://lessons.church/';
                        const lessonsUrl = (targetSlug && !isStagingSlug) ? `https://lessons.church/${targetSlug}` : fallbackUrl;
                        const isPreTeen = lesson.name?.toLowerCase().includes('loop') || lesson.name?.toLowerCase().includes('elementary');

                        return (
                          <div
                            key={lesson.id}
                            className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between h-full group
                              ${curriculumTrack === 'kids'
                                ? (isPreTeen ? 'bg-indigo-50/20 hover:bg-indigo-50/40 border-indigo-100' : 'bg-amber-50/40 hover:bg-amber-50/80 border-amber-100')
                                : 'bg-emerald-50/30 hover:bg-emerald-50/65 border-emerald-100'
                              }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full
                                  ${curriculumTrack === 'kids'
                                    ? (isPreTeen ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800')
                                    : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {curriculumTrack === 'kids' ? (isPreTeen ? 'Grades 3-6' : 'Ages 2-7') : 'Ages 13-15'}
                                </span>
                                {lesson.image && (
                                  <img src={lesson.image} className="w-8 h-8 rounded-lg object-cover border border-white/50" alt="" />
                                )}
                              </div>
                              <h4 className={`font-sans font-bold text-lg group-hover:text-teal-900 transition-colors
                                ${curriculumTrack === 'kids'
                                  ? (isPreTeen ? 'text-indigo-800' : 'text-amber-800')
                                  : 'text-emerald-800'
                                }`}
                              >
                                {lesson.name}
                              </h4>
                              <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
                                {lesson.shortDescription || lesson.description || 'No overview available for this program.'}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 font-semibold italic">Powered by ChurchApps</span>
                              <a
                                href={lessonsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs font-black hover:underline flex items-center gap-0.5
                                  ${curriculumTrack === 'kids'
                                    ? (isPreTeen ? 'text-indigo-750' : 'text-amber-700')
                                    : 'text-emerald-700'
                                  }`}
                              >
                                View full lesson &rarr;
                              </a>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}
            {/* Bible Study Notes Search Panel for Teachers */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-150 shadow-sm space-y-4 text-left animate-in fade-in duration-300">
              <h3 className="text-xl font-black text-teal-800 tracking-tight flex items-center gap-2">
                <BookOpen size={22} className="text-teal-650" /> Lesson Preparation Study Notes
              </h3>
              <p className="text-xs text-gray-500">
                Search any book, chapter, or verse (e.g. <code className="bg-gray-50 px-1 py-0.5 rounded text-teal-755 font-bold font-mono">John 3:16</code> or <code className="bg-gray-50 px-1 py-0.5 rounded text-teal-755 font-bold font-mono">Luke 15</code>) to load contextual study notes from the Tyndale collection.
              </p>

              <form onSubmit={handleSearchStudyNotes} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={studyNotesQuery}
                  onChange={e => setStudyNotesQuery(e.target.value)}
                  placeholder="e.g. John 3:16"
                  className="flex-grow text-xs border border-gray-250 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
                <button
                  type="submit"
                  disabled={isLoadingNotes}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoadingNotes ? 'Loading...' : 'Find Notes'}
                </button>
              </form>

              {studyNotesResults.length > 0 && (
                <div className="space-y-4 max-h-[300px] overflow-y-auto border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  {studyNotesResults.map((note, index) => (
                    <div key={index} className="space-y-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <h4 className="font-sans font-bold text-sm text-teal-800 flex items-center gap-1.5 text-left">
                        <span className="bg-teal-100 text-teal-700 text-[10px] px-2 py-0.5 rounded-md font-mono">{note.usfm_start || note.ref}</span>
                        {note.title}
                      </h4>
                      <div className="text-xs text-gray-700 leading-relaxed font-sans prose prose-sm max-w-none">
                        <StudyNote contentHtml={note.content_html} />
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-[10px] text-gray-400 italic pt-2 mt-2 border-t border-gray-100 text-left">
                    Tyndale Open Study Notes &copy; 2019 Tyndale House Publishers. Used under CC BY-SA 4.0.
                  </div>
                </div>
              )}

              {studyNotesSearched && studyNotesResults.length === 0 && !isLoadingNotes && (
                <p className="text-xs italic text-gray-400 text-center py-2">
                  No study notes found for this reference. Please check your spelling and formatting (e.g. John 3:16).
                </p>
              )}
            </div>

            <ContentSection title="Evangelism Resources" items={TEACHERS_CONTENT} colorTheme="text-teal-700" />

            {/* Bible Verse Spotlight */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-teal-200/60 relative overflow-hidden text-gray-700 animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 p-3 bg-teal-600 text-white rounded-bl-2xl">
                <Trophy size={18} />
              </div>
              <h3 className="text-2xl text-teal-700 mb-4 font-sans font-bold">Scripture for the Day</h3>
              <VerseOfTheWeek versionId={12} />
            </div>

            {/* Admin: Scripture Override Control Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-150 relative overflow-hidden text-gray-700 animate-in fade-in duration-300">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={16} className="text-teal-650" /> Admin Verse of the Day Control
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Input any YouVersion Bible reference code (e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-teal-700 font-bold">JHN.3.16</code> or <code className="bg-gray-100 px-1.5 py-0.5 rounded text-teal-700 font-bold">ROM.12.1-2</code>) to override the homepage scripture spotlight.
              </p>

              <form onSubmit={handleSaveCustomVerse} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={customVerseInput}
                  onChange={e => setCustomVerseInput(e.target.value)}
                  placeholder="e.g. JHN.3.16"
                  className="flex-grow text-xs border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
                <button
                  type="submit"
                  disabled={isSavingCustomVerse}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingCustomVerse ? 'Saving...' : 'Update Spotlight'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (AI Assistant) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GeminiAssistant audience={Audience.TEACHERS} />
            </div>
          </div>

        </div>

        {/* Dynamic Teacher Submodals */}
        {activeTeacherModal !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setActiveTeacherModal(null)}></div>
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-gray-100">

              <div className="bg-teal-700 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-base font-bold flex items-center gap-2">
                  {activeTeacherModal === 'convert' && <><Users size={18} /> New Convert Tracker</>}
                  {activeTeacherModal === 'decision' && <><ClipboardList size={18} /> Digital Decision Cards</>}
                  {activeTeacherModal === 'schedule' && <><Calendar size={18} /> Follow-up Scheduler</>}
                </h3>
                <button onClick={() => setActiveTeacherModal(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 max-h-[350px] overflow-y-auto">
                {activeTeacherModal === 'convert' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 mb-2">Registered decisions during junior church services:</p>
                    {newConverts.length === 0 ? (
                      <p className="text-sm italic text-gray-400 text-center py-4">No records found.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {newConverts.map((con, i) => (
                          <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-start text-xs">
                            <div>
                              <p className="font-bold text-gray-800">{con.name}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Notes: {con.notes}</p>
                            </div>
                            <div className="text-right">
                              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-bold">Age: {con.age}</span>
                              <p className="text-[10px] text-gray-400 mt-1">{con.decisionDate}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTeacherModal === 'decision' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-gray-500 mb-2">Decision card logs from the online salvation guide:</p>
                    <div className="p-3 bg-gray-50 border border-gray-150 rounded-lg">
                      <p className="font-bold text-gray-800">Review altar calls</p>
                      <p className="text-gray-500 mt-1 leading-relaxed">
                        Whenever someone completes the online Salvation step guide, their contact email and name are logged here instantly. Use this sheet to contact them.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold text-teal-800">Salvation Guidelines</p>
                          <p className="text-gray-500 mt-0.5">Focus: Confirm ABC commitment details.</p>
                        </div>
                        <Check size={14} className="text-teal-600" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTeacherModal === 'schedule' && (
                  <div className="space-y-4 text-xs text-gray-600">
                    <p className="text-xs text-gray-500">Curriculum standard follow-up list for new converts:</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5 p-2 border-b border-gray-100">
                        <input type="checkbox" defaultChecked className="mt-0.5 h-3.5 w-3.5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded" />
                        <div>
                          <p className="font-bold text-gray-800">Checklist Hour 0: Lead Altar Prayer</p>
                          <p className="text-gray-500 mt-0.5">Confirm they filled their digital Decision Card name and contact.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2 border-b border-gray-100">
                        <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded" />
                        <div>
                          <p className="font-bold text-gray-800">Checklist Hour 24: Send SMS/Email</p>
                          <p className="text-gray-500 mt-0.5">Welcome them to the tribe and send children devotion booklet.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2">
                        <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded" />
                        <div>
                          <p className="font-bold text-gray-800">Checklist Day 7: Connect at Class</p>
                          <p className="text-gray-500 mt-0.5">Confirm they attended kids zone or teens meeting and check understanding.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-3.5 flex justify-end">
                <button
                  onClick={() => setActiveTeacherModal(null)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded transition-colors cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (currentView === Audience.ADMIN) {
    if (isAdminLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500">Loading admin session...</p>
          </div>
        </div>
      );
    }

    if (!adminStaff) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
          <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-teal-800 flex items-center justify-center shadow-lg shadow-teal-200">
                <Shield className="text-white" size={26} />
              </div>
            </div>
            <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-gray-900">
              Faith Tribe Admin
            </h2>
            <p className="mt-1.5 text-center text-sm text-gray-500 font-medium">
              Sign in to manage curriculum, review content, and configure live streams.
            </p>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
            <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-150 text-left">
              <form className="space-y-4" onSubmit={handleTeacherLogin}>
                <div>
                  <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Email address
                  </label>
                  <input
                    id="admin-email"
                    name="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="admin@faithtribe.com"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full justify-center rounded-full bg-teal-700 py-2.5 px-4 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-800 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer mt-1"
                >
                  Sign In
                </button>
              </form>
            </div>
            <div className="text-center mt-6">
              <button 
                onClick={() => navigateToView(Audience.HOME)}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 cursor-pointer"
              >
                &larr; Back to Public Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <AdminLayout 
        currentStaff={adminStaff} 
        onSignOut={handleAdminSignOut} 
        onNavigateHome={() => navigateToView(Audience.HOME)} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Navbar
        currentView={currentView}
        onChangeView={navigateToView}
        onWatchLive={() => setIsLiveStreamOpen(true)}
        isLive={broadcastStatus.isLive}
      />

      <main className="flex-grow">
        {currentView === Audience.HOME && <HomeView />}
        {currentView === Audience.ABOUT && <AboutView />}
        {currentView === Audience.KIDS && <KidsView />}
        {currentView === Audience.TEENS && <TeensView />}
        {currentView === Audience.TEACHERS && !isTeacherLoggedIn && (
          <div className="min-h-[100dvh] bg-gray-50 flex flex-col justify-center py-6 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg shadow-teal-200">
                  <Lock className="text-white" size={22} />
                </div>
              </div>
              <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-gray-900">
                Teachers Hub
              </h2>
              <p className="mt-1.5 text-center text-sm text-gray-500">
                Access curriculum plans and manage discipleship tracking.
              </p>
            </div>

            <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md px-4">
              <div className="bg-white py-6 px-6 shadow-xl rounded-3xl border border-gray-150">
                <form className="space-y-4" onSubmit={handleTeacherLogin}>
                  <div>
                    <label htmlFor="teacher-email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Email address
                    </label>
                    <input
                      id="teacher-email"
                      name="teacher-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="admin@faithtribe.com"
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="teacher-password" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Password
                    </label>
                    <input
                      id="teacher-password"
                      name="teacher-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-full bg-teal-700 py-2.5 px-4 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-800 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer mt-1"
                  >
                    Sign In
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {currentView === Audience.TEACHERS && isTeacherLoggedIn && <TeachersView />}
        {currentView === Audience.BIBLE && <BibleReaderView onBack={() => navigateToView(Audience.HOME)} />}
      </main>

      <footer className="bg-[#372f58] text-white py-14 border-t border-[#4d4475] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="text-xl font-bold tracking-tight text-white mb-4">Faith Tribe</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                RCCG Region 63 Junior Church Portal.
              </p>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">
                Winning souls, raising kingdom champions, and establishing teen disciples.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><button onClick={() => navigateToView(Audience.HOME)} className="hover:text-[#1CABB9] transition-colors cursor-pointer">Home</button></li>
                <li><button onClick={() => navigateToView(Audience.ABOUT)} className="hover:text-[#1CABB9] transition-colors cursor-pointer">About Us</button></li>
                <li><button onClick={() => navigateToView(Audience.KIDS)} className="hover:text-[#1CABB9] transition-colors cursor-pointer">Kids Zone</button></li>
                <li><button onClick={() => navigateToView(Audience.TEENS)} className="hover:text-[#1CABB9] transition-colors cursor-pointer">Teens Tribe</button></li>
                <li><button onClick={() => navigateToView(Audience.TEACHERS)} className="hover:text-[#1CABB9] transition-colors cursor-pointer">Teachers Hub</button></li>
                <li><button onClick={() => navigateToView(Audience.BIBLE)} className="hover:text-[#1CABB9] transition-colors cursor-pointer">Read Bible</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white mb-4">Connect</h4>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                RCCG Region 63 Junior Church.
              </p>
              <div className="flex space-x-3 mb-6">
                <a href="https://www.instagram.com/faithtribe_rg63" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full cursor-pointer hover:bg-[#1CABB9] transition-all hover:scale-110 flex items-center justify-center text-white" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61591368402377" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full cursor-pointer hover:bg-[#1CABB9] transition-all hover:scale-110 flex items-center justify-center text-white" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="https://www.youtube.com/@FaithTribe_official" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full cursor-pointer hover:bg-[#1CABB9] transition-all hover:scale-110 flex items-center justify-center text-white" aria-label="YouTube">
                  <Youtube size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright & Attribution Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 pt-8 border-t border-[#4d4475] mb-8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>&copy; {new Date().getFullYear()} Faith Tribe</span>
              <img src="/Faith_Tribe_Grey-rbg.png" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" alt="Faith Tribe logo" />
              <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-mono text-white/60">
                DB: {supabase ? 'Supabase' : 'Offline Sandbox'}
              </span>
            </div>
            <div>
              A digital ministry of RCCG Region 63 Junior Church
            </div>
          </div>

          {/* Thin Horizontal Divider Line above the giant wordmark */}
          <hr className="border-[#4d4475] my-6 opacity-60" />

          {/* Giant Wordmark */}
          <div className="footer-wordmark-wrapper text-center">
            <span className="footer-wordmark font-display inline-block">FaithTribe</span>
          </div>
        </div>
      </footer>

      {/* Prayer Request Modal */}
      {isPrayerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" aria-labelledby="prayer-modal-title" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPrayerModalOpen(false)}
          ></div>

          <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-gray-150">
            <div className="bg-[#372f58] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-base font-extrabold flex items-center gap-2" id="prayer-modal-title">
                <Heart className="fill-current text-[#F8B229]" size={18} /> Request Prayer Support
              </h3>
              <button
                onClick={() => setIsPrayerModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handlePrayerSubmit}>
                <div className="mb-4">
                  <label htmlFor="request" className="block text-xs font-bold uppercase tracking-wider text-[#372f58]/60 mb-2">
                    How can our prayer squad lift you up?
                  </label>
                  <textarea
                    id="request"
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl shadow-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-[#1CABB9]/30 focus:border-[#1CABB9] text-sm resize-none"
                    rows={4}
                    placeholder="Describe your needs, we will stand in faith with you..."
                    required
                  />
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#F8B229] px-6 py-3 text-sm font-bold text-[#372f58] shadow-lg shadow-[#F8B229]/20 hover:bg-[#372f58] hover:text-white hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <Send size={14} />
                    Send Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrayerModalOpen(false)}
                    className="w-full inline-flex justify-center py-2 text-xs font-semibold text-[#372f58]/50 hover:text-[#372f58] underline-offset-2 hover:underline transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Salvation Guide Modal ("Meet Jesus" using ABC Method) */}
      {isSalvationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={resetSalvationModal}></div>
          <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-gray-150">

            {/* Modal Header */}
            <div className="bg-[#372f58] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Sparkles size={18} className="text-[#F8B229]" />
                <span>Salvation Guide: The ABC Steps</span>
              </h3>
              <button onClick={resetSalvationModal} className="text-white/70 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Steps Progress Indicator */}
            <div className="bg-[#372f58]/5 px-6 py-3.5 border-b border-[#372f58]/10 flex items-center justify-between text-xs font-bold text-[#372f58]">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${salvationStep >= 1 ? 'bg-[#F8B229] text-[#372f58] border-[#F8B229]' : 'border-[#372f58]/30 text-[#372f58]/50'}`}>1</span>
                <span>Admit</span>
              </div>
              <div className="w-8 h-[2px] bg-[#372f58]/20"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${salvationStep >= 2 ? 'bg-[#F8B229] text-[#372f58] border-[#F8B229]' : 'border-[#372f58]/30 text-[#372f58]/50'}`}>2</span>
                <span>Believe</span>
              </div>
              <div className="w-8 h-[2px] bg-[#372f58]/20"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${salvationStep >= 3 ? 'bg-[#F8B229] text-[#372f58] border-[#F8B229]' : 'border-[#372f58]/30 text-[#372f58]/50'}`}>3</span>
                <span>Confess</span>
              </div>
            </div>

            {/* Modal Body / Steps Content */}
            <div className="p-6">
              {!salvationFormSubmitted ? (
                <>
                  {salvationStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-[#372f58]/5 p-4 rounded-xl border border-[#372f58]/10">
                        <h4 className="font-extrabold text-[#372f58] text-sm">Step A: Admit</h4>
                        <p className="text-xs text-[#372f58]/75 mt-1 leading-relaxed">
                          Admit that you have made mistakes and sinned. We all fall short, but admitting this opens our hearts to receive forgiveness.
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#1CABB9] border-t border-r border-b border-gray-100">
                        <span className="text-[10px] font-bold text-[#1CABB9] uppercase tracking-widest">Scripture Focus</span>
                        <p className="text-xs italic text-gray-600 mt-1 leading-relaxed">
                          "For all have sinned and fall short of the glory of God."
                        </p>
                        <p className="text-right text-[10px] font-bold text-gray-500 mt-1">- Romans 3:23</p>
                      </div>
                      <button
                        onClick={() => setSalvationStep(2)}
                        className="w-full bg-[#372f58] hover:bg-[#1CABB9] text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Next Step: Believe <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {salvationStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-[#372f58]/5 p-4 rounded-xl border border-[#372f58]/10">
                        <h4 className="font-extrabold text-[#372f58] text-sm">Step B: Believe</h4>
                        <p className="text-xs text-[#372f58]/75 mt-1 leading-relaxed">
                          Believe that Jesus is the Son of God, and that He died on the cross and rose from the grave to pay for your mistakes and give you eternal life.
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#1CABB9] border-t border-r border-b border-gray-100">
                        <span className="text-[10px] font-bold text-[#1CABB9] uppercase tracking-widest">Scripture Focus</span>
                        <p className="text-xs italic text-gray-600 mt-1 leading-relaxed">
                          "Believe in the Lord Jesus, and you will be saved..."
                        </p>
                        <p className="text-right text-[10px] font-bold text-gray-500 mt-1">- Acts 16:31</p>
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => setSalvationStep(1)}
                          className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setSalvationStep(3)}
                          className="w-2/3 bg-[#372f58] hover:bg-[#1CABB9] text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Next Step: Confess <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {salvationStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-[#1CABB9]/5 p-4 rounded-xl border border-[#1CABB9]/10 text-xs">
                        <h4 className="font-extrabold text-[#372f58] text-sm">Step C: Confess &amp; Commit</h4>
                        <p className="text-[#372f58]/75 mt-1 leading-relaxed">
                          Confess Jesus as your Savior. Pray this prayer from your heart:
                        </p>
                        <p className="mt-2.5 italic font-bold text-[#372f58] bg-white/70 p-3 rounded-lg border border-[#1CABB9]/10 leading-relaxed">
                          "Lord Jesus, I admit I have made mistakes. I believe You died for my sins and rose again. I ask You to come into my heart, wash me clean, and be my forever Savior. Thank you for saving me. Amen!"
                        </p>
                      </div>

                      <form onSubmit={handleSalvationSubmit} className="space-y-3">
                        <p className="text-[10px] font-bold text-[#372f58]/40 uppercase tracking-widest">Sign Your Decision Card</p>
                        <input
                          type="text"
                          required
                          value={salvationName}
                          onChange={e => setSalvationName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-[#1CABB9]"
                        />
                        <input
                          type="email"
                          required
                          value={salvationEmail}
                          onChange={e => setSalvationEmail(e.target.value)}
                          placeholder="Your Email Address"
                          className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-[#1CABB9]"
                        />

                        <div className="flex gap-2.5 mt-2">
                          <button
                            type="button"
                            onClick={() => setSalvationStep(2)}
                            className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="w-2/3 bg-[#F8B229] hover:bg-[#372f58] text-[#372f58] hover:text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-md shadow-[#F8B229]/30 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send size={12} /> Submit Decision
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-4 animate-in zoom-in duration-300">
                  <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg">Congratulations, {salvationName}!</h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
                      Your decision card has been recorded. Heaven is celebrating! We have registered you in the Class Altar Tracker.
                    </p>
                  </div>
                  <button
                    onClick={resetSalvationModal}
                    className="bg-[#372f58] hover:bg-[#1CABB9] text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-md shadow-[#372f58]/20 cursor-pointer transition-colors"
                  >
                    Return to Portal
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Live Stream Overlay */}
      {isLiveStreamOpen && (
        <LiveStreamPlayer onClose={() => setIsLiveStreamOpen(false)} />
      )}

      {/* Brand Toast System — mounted once at root, styled with Faith Tribe palette */}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: 'inherit',
            borderRadius: '999px',
            border: '1px solid rgba(55, 47, 88, 0.12)',
            padding: '14px 20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#372f58',
            background: '#ffffff',
            boxShadow: '0 8px 32px rgba(55, 47, 88, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
          },
          className: 'faith-toast',
        }}
        icons={{
          success: '✅',
          error: '⚠️',
          info: 'ℹ️',
        }}
      />
    </div>
  );
};

export default App;
