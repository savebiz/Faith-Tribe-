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
import { getCurriculumCache, saveCurriculumCache, fetchCustomVerse, updateCustomVerse, fetchStudyNotesForChapter, signInStaff, signOutStaff, getCurrentStaff, fetchBroadcastStatus, fetchContentItems, supabase, registerConvert, fetchConverts, fetchFollowUpTasks, toggleFollowUpTask, fetchActiveClassGoal, updateOrCreateClassGoal } from './lib/supabase';
import { WEEKLY_FUN_ITEMS, WeeklyFunItem } from './lib/weeklyFunConfig';
import { WeeklyFunModal } from './components/WeeklyFunModal';
import { TeensContentModal } from './components/TeensContentModal';
import { AdminLayout } from './components/AdminLayout';

// --- Mock Data ---
export const KIDS_CONTENT: ContentItem[] = [
  { id: '1', title: 'Meet Your New Best Friend', description: 'Who is Jesus and why does He love you so much?', thumbnail: 'https://picsum.photos/seed/jesuslove/400/250', type: 'VIDEO', duration: '5:24' },
  { id: '2', title: 'David and Goliath: Tiny Courage', description: 'Learn how David faced the giant with God\'s help!', thumbnail: 'https://picsum.photos/seed/david/400/250', type: 'VIDEO', duration: '6:12' },
  { id: '3', title: 'The ABCs of Salvation', description: 'A fun activity to learn how to ask Jesus into your heart.', thumbnail: 'https://picsum.photos/seed/abc/400/250', type: 'ACTIVITY', duration: 'Activity PDF' },
];

export const TEENS_CONTENT: ContentItem[] = [
  { 
    id: '4', 
    title: 'Why Faith? Why Now?', 
    description: 'Is God real? A real talk for skeptics and seekers.', 
    thumbnail: 'https://picsum.photos/seed/skeptic/400/250', 
    type: 'VIDEO', 
    duration: '12:45',
    youtubeVideoId: 'kP_S45J0p48'
  },
  { 
    id: '5', 
    title: 'How to Share Without Being Cringe', 
    description: 'Practical tips on inviting friends to Faith Tribe.', 
    thumbnail: 'https://picsum.photos/seed/share/400/250', 
    type: 'ARTICLE', 
    duration: '4 min read',
    articleContent: `# How to Share Without Being Cringe

Sharing your faith doesn't mean standing on a soapbox with a megaphone or sending weird unsolicited DMs. It's about genuine connection, real relationships, and being yourself.

Here are **3 practical tips** to share Jesus with your friends without it feeling forced or cringe:

### 1. Just Be Real (No "Holy" Filter)
You don't need to speak in old English or pretend your life is perfect. Share your honest struggles and how God helped you through them. Authenticity is magnetic.

> *"People don't want a perfect Christian. They want a real one."*

### 2. Focus on Inviting, Not Arguing
Don't get dragged into online debates or theological arguments. Instead, invite them to something fun. 
*"Hey, we're hanging out at Faith Tribe Teens this Friday. We have free food, great music, and a lot of laughs. Do you want to tag along?"* 

### 3. Live It Out Loud
Your actions speak louder than any post. Show up for people when they are hurting. Be the friend who listens, supports, and stays when others leave. 
When people notice you're different, they'll ask why. That's your open door!`
  },
  { 
    id: '6', 
    title: 'My Salvation Story', 
    description: 'Community members share how they found purpose.', 
    thumbnail: 'https://picsum.photos/seed/testimony/400/250', 
    type: 'VIDEO', 
    duration: '8:30',
    youtubeVideoId: 'yV7n-vY5d6U'
  },
];

export const TEACHERS_CONTENT: ContentItem[] = [
  { 
    id: '7', 
    title: 'The Art of the Altar Call', 
    description: 'How to lead children to Christ effectively.', 
    thumbnail: 'https://picsum.photos/seed/altar/400/250', 
    type: 'ARTICLE', 
    duration: '8 min read',
    articleContent: `# The Art of the Altar Call

Leading children to Christ is one of the most rewarding aspects of children's ministry. However, it requires care, simplicity, and sensitivity.

Here is a simple framework to guide children through a meaningful decision:

### 1. Keep It Simple (The ABCs)
Avoid complex theological jargon. Use simple, concrete terms that children understand:
- **A**dmit: Agree with God that you have done things wrong (sinned).
- **B**elieve: Believe that Jesus died for your sins and rose again to give you life.
- **C**hoose: Choose to follow Jesus and make Him the leader of your life.

### 2. Make It Safe
Never pressure or coerce children. An altar call should be a response to love, not fear. Give them space to ask questions and explain their choice in their own words.

### 3. Follow Up Immediately
Once a child makes a decision, celebrate with them! Give them a simple bible resource or a congratulations card, and ensure their parents are informed.`
  },
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
  const [isAltarScriptModalOpen, setIsAltarScriptModalOpen] = useState(false);



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

  const handleSalvationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvationFormSubmitted(true);
    if (salvationName) {
      try {
        await registerConvert(salvationName, null, "Online decision card submission.", adminStaff?.id || null);
      } catch (err) {
        console.warn("Failed to register convert from salvation guide:", err);
      }
    }
  };

  const resetSalvationModal = () => {
    setIsSalvationModalOpen(false);
    setSalvationStep(1);
    setSalvationName('');
    setSalvationEmail('');
    setSalvationFormSubmitted(false);
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

  const TeensView = () => {
    const [selectedTeensItem, setSelectedTeensItem] = useState<ContentItem | null>(null);
    const [teensContentItems, setTeensContentItems] = useState<ContentItem[]>(TEENS_CONTENT);
    const [isLoadingTeens, setIsLoadingTeens] = useState(false);
    const [topicTitle, setTopicTitle] = useState('Identity in a Filtered World');
    const [topicDesc, setTopicDesc] = useState('Who are you when the screen is turned off? Learn how Christ defines your worth, potential, and future far beyond likes and comments.');
    const [topicVideoId, setTopicVideoId] = useState('dQw4w9WgXcQ');
    const [teensStreak] = useState(() => {
      const saved = localStorage.getItem('ft_bible_streak');
      return saved ? Number(saved) : 0;
    });

    useEffect(() => {
      async function loadTeensContent() {
        try {
          setIsLoadingTeens(true);
          const dbItems = await fetchContentItems('teens', undefined, 'published');
          if (dbItems && dbItems.length > 0) {
            const mapped: ContentItem[] = dbItems.map(item => {
              const fallback = TEENS_CONTENT.find(t => t.id === item.id || t.title.toLowerCase() === item.title.toLowerCase());
              return {
                id: item.id,
                title: item.title,
                description: item.description || fallback?.description || '',
                thumbnail: item.thumbnail_url || fallback?.thumbnail || 'https://picsum.photos/seed/teens/400/250',
                type: (item.type === 'video' ? 'VIDEO' : item.type === 'audio' ? 'AUDIO' : item.type === 'document' ? 'DOCUMENT' : 'ARTICLE') as any,
                duration: item.duration || fallback?.duration || undefined,
                youtubeVideoId: item.video_id || fallback?.youtubeVideoId || undefined,
                articleContent: item.story_content || fallback?.articleContent || undefined,
                videoSource: item.video_source || fallback?.videoSource || undefined,
                documentUrl: item.document_url || fallback?.documentUrl || undefined
              };
            });
            setTeensContentItems(mapped);
          }
        } catch (err: any) {
          console.error('Failed to fetch teens content:', err);
        } finally {
          setIsLoadingTeens(false);
        }
      }
      
      async function loadBroadcastSettings() {
        try {
          const status = await fetchBroadcastStatus();
          if (status.teens_topic_title) setTopicTitle(status.teens_topic_title);
          if (status.teens_topic_desc) setTopicDesc(status.teens_topic_desc);
          if (status.teens_topic_video_id) setTopicVideoId(status.teens_topic_video_id);
        } catch (err) {
          console.error('Failed to load teens topic of the month:', err);
        }
      }

      loadTeensContent();
      loadBroadcastSettings();
    }, []);

    const triggerShareFriends = async () => {
      const shareData = {
        title: 'Faith Tribe Teens',
        text: 'Join me on Faith Tribe Teens — a place for genuine questions and real faith!',
        url: window.location.origin + '/teens'
      };
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          toast.success('Shared successfully! 🔗');
        } catch (err) {
          console.warn('Share failed:', err);
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          toast.success('Invite link copied to clipboard! Share with your friends. 🔗', { duration: 4000 });
        } catch (cErr) {
          toast.error('Failed to copy link. Please copy the URL bar!');
        }
      }
    };

    const sermonVideoItem: ContentItem = {
      id: 'sermon-identity',
      title: topicTitle,
      description: topicDesc,
      thumbnail: 'https://picsum.photos/seed/teens/1200/400',
      type: 'VIDEO',
      youtubeVideoId: topicVideoId
    };

    return (
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
                onClick={triggerShareFriends}
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
              <p className="text-2xl font-black text-white">"{topicTitle}"</p>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
                {topicDesc}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => setSelectedTeensItem(sermonVideoItem)}
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

            {isLoadingTeens ? (
              <div className="bg-gray-900/60 p-12 rounded-3xl border border-gray-800 text-center">
                <p className="text-sm text-gray-400 animate-pulse">Loading latest drops...</p>
              </div>
            ) : (
              <ContentSection 
                title="Latest Drops" 
                items={teensContentItems} 
                colorTheme="text-emerald-400" 
                onItemClick={(item) => setSelectedTeensItem(item)}
              />
            )}

            {/* Bible Verse Spotlight */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-emerald-200/60 relative overflow-hidden text-gray-700 animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 p-3 bg-emerald-400 text-white rounded-bl-2xl flex items-center gap-1 font-bold text-xs">
                <Flame size={14} className="fill-current text-yellow-300 animate-pulse" />
                <span>{teensStreak} Day Streak</span>
              </div>
              <h3 className="text-2xl text-emerald-600 mb-4 font-sans font-bold">Verse of the Day</h3>
              <VerseOfTheWeek versionId={1588} showStudyNotes={true} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GeminiAssistant 
                audience={Audience.TEENS} 
                onSelectAction={(action) => {
                  if (action === 'get_saved') {
                    setIsSalvationModalOpen(true);
                    setSalvationStep(1);
                  } else if (action === 'share_faith') {
                    triggerShareFriends();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* In-app Teens Content Viewer Modal */}
        {selectedTeensItem && (
          <TeensContentModal 
            item={selectedTeensItem} 
            onClose={() => setSelectedTeensItem(null)} 
          />
        )}
      </div>
    );
  };

  const TeachersView = () => {
    // Phase 2 converts and goals states
    const [converts, setConverts] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [goal, setGoal] = useState<any | null>(null);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [goalTargetInput, setGoalTargetInput] = useState(5);
    const [goalTitleInput, setGoalTitleInput] = useState('Evangelism Focus');

    // Form inputs
    const [convertNameInput, setConvertNameInput] = useState('');
    const [convertAgeInput, setConvertAgeInput] = useState('');
    const [convertNotesInput, setConvertNotesInput] = useState('');

    // Phase 3 search and resource states
    const [studyNotesQuery, setStudyNotesQuery] = useState('');
    const [studyNotesResults, setStudyNotesResults] = useState<any[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [studyNotesSearched, setStudyNotesSearched] = useState(false);

    const [curriculumSearchText, setCurriculumSearchText] = useState('');
    const [curriculumResults, setCurriculumResults] = useState<any[]>([]);
    const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
    const [curriculumSearchSearched, setCurriculumSearchSearched] = useState(false);
    const [curriculumTrack, setCurriculumTrack] = useState<'kids' | 'teens'>('kids');

    const [evangelismResources, setEvangelismResources] = useState<any[]>([]);
    const [isLoadingEvangelism, setIsLoadingEvangelism] = useState(false);

    const loadData = async () => {
      try {
        const userId = adminStaff?.id || null;
        const [convertsData, tasksData, goalData] = await Promise.all([
          fetchConverts(userId),
          fetchFollowUpTasks(userId),
          fetchActiveClassGoal(userId)
        ]);
        setConverts(convertsData);
        setTasks(tasksData);
        setGoal(goalData);
        if (goalData) {
          setGoalTargetInput(goalData.target_count);
          setGoalTitleInput(goalData.goal_title);
        }
      } catch (err) {
        console.error("Failed to load Teachers data:", err);
      }
    };

    const loadEvangelismResources = async () => {
      setIsLoadingEvangelism(true);
      try {
        if (isRealSupabase && supabase) {
          const { data, error } = await supabase
            .from('bible_study_notes')
            .select('*')
            .eq('tier', 'advanced')
            .limit(4);
          if (error) throw error;
          setEvangelismResources(data || []);
        } else {
          // Mock seeds
          setEvangelismResources([
            { ref: "GEN 1:1", title: "Introduction to Creation Guide", content_html: "<p>Understanding creation as a foundation for young minds. Teach them that God created everything with a plan.</p><p><em>Source: Tyndale Advanced Guides</em></p>" },
            { ref: "JHN 3:16", title: "Eternal Life & Love Study Guide", content_html: "<p>The ultimate promise of salvation. Use this guide to lead altar calls and explain commitment to children.</p><p><em>Source: Tyndale Advanced Guides</em></p>" },
            { ref: "ROM 12:1", title: "Living Sacrifices Discipleship Notes", content_html: "<p>Practical discipleship for daily living. Helping youth dedicate their lives to service.</p><p><em>Source: Tyndale Advanced Guides</em></p>" }
          ]);
        }
      } catch (err) {
        console.warn("Failed to query evangelism resources:", err);
      } finally {
        setIsLoadingEvangelism(false);
      }
    };

    useEffect(() => {
      if (isTeacherLoggedIn) {
        loadData();
        loadEvangelismResources();
      }
    }, [isTeacherLoggedIn]);

    // Handlers
    const handleRegisterDecision = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!convertNameInput.trim()) return;
      const ageNum = convertAgeInput ? Number(convertAgeInput) : null;
      try {
        const userId = adminStaff?.id || null;
        await registerConvert(convertNameInput, ageNum, convertNotesInput || 'Registered manually', userId);
        toast.success(`Successfully registered decision for ${convertNameInput}! ✨`);
        setConvertNameInput('');
        setConvertAgeInput('');
        setConvertNotesInput('');
        loadData();
      } catch (err) {
        toast.error("Failed to register decision.");
      }
    };

    const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
      try {
        const ok = await toggleFollowUpTask(taskId, !currentCompleted);
        if (ok) {
          toast.success("Follow-up task updated!");
          loadData();
        } else {
          toast.error("Could not update task.");
        }
      } catch (err) {
        toast.error("Error updating task.");
      }
    };

    const handleUpdateGoal = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const userId = adminStaff?.id || null;
        await updateOrCreateClassGoal(userId, goalTargetInput, goalTitleInput);
        toast.success("Sunday Goal updated successfully!");
        setIsEditingGoal(false);
        loadData();
      } catch (err) {
        toast.error("Failed to update goal.");
      }
    };

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

    const handleSearchCurriculum = async (e: React.FormEvent) => {
      e.preventDefault();
      const text = curriculumSearchText.trim();
      if (!text) return;
      setIsLoadingCurriculum(true);
      setCurriculumSearchSearched(true);
      try {
        if (isRealSupabase && supabase) {
          const parsedRef = parseScriptureReference(text);
          let query = supabase.from('bible_study_notes').select('*');
          if (parsedRef) {
            const prefix = `${parsedRef.bookCode.toUpperCase()} ${parsedRef.chapter}`;
            query = query.or(`usfm_start.eq.${prefix},usfm_start.like.${prefix}:%`);
          } else {
            query = query.ilike('title', `%${text}%`);
          }
          const { data, error } = await query.limit(20);
          if (error) throw error;
          setCurriculumResults(data || []);
        } else {
          const allNotes = [
            { ref: "MAT 19:21", title: "Treasure in Heaven Guide (Kids)", content_html: "<p>Altar call material for kids about letting go of self and seeking God.</p>" },
            { ref: "JHN 3:16", title: "Eternal Life Study Note (Teens)", content_html: "<p>Apologetics study note on understanding God's love and salvation for teens.</p>" },
            { ref: "PSA 23:1", title: "The Lord is My Shepherd (Kids)", content_html: "<p>Discipleship guide helping children build a habit of trusting God daily.</p>" }
          ];
          const filtered = allNotes.filter(n => 
            n.title.toLowerCase().includes(text.toLowerCase()) || 
            n.ref.toLowerCase().includes(text.toLowerCase())
          );
          setCurriculumResults(filtered);
        }
      } catch (err) {
        toast.error("Failed to query curriculum database.");
      } finally {
        setIsLoadingCurriculum(false);
      }
    };

    // Calculate goals count
    const targetCount = goal?.target_count || 5;
    const currentCount = converts.length;
    const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));

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
          <div className="lg:col-span-2 space-y-8 text-left">

            {/* Bento Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Tracker Widget Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-lg flex flex-col justify-between relative group">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-teal-100 flex items-center gap-2">
                      <Trophy size={18} /> Sunday Class Goal
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setIsEditingGoal(!isEditingGoal)}
                        className="text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        {isEditingGoal ? 'Cancel' : 'Edit Goal'}
                      </button>
                      <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                    </div>
                  </div>

                  {isEditingGoal ? (
                    <form onSubmit={handleUpdateGoal} className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={goalTitleInput}
                          onChange={e => setGoalTitleInput(e.target.value)}
                          placeholder="Goal Title"
                          className="w-2/3 text-xs bg-teal-900/40 border border-teal-650 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-white placeholder-teal-300"
                        />
                        <input
                          type="number"
                          required
                          min={1}
                          value={goalTargetInput}
                          onChange={e => setGoalTargetInput(Number(e.target.value))}
                          placeholder="Target Souls"
                          className="w-1/3 text-xs bg-teal-900/40 border border-teal-650 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-yellow-400 hover:bg-yellow-500 text-teal-950 text-[10px] font-black py-1 px-3 rounded cursor-pointer transition-colors"
                      >
                        Save Goal Settings
                      </button>
                    </form>
                  ) : (
                    <>
                      <h4 className="text-2xl font-black mt-4">{goal?.goal_title || 'Evangelism Focus'}</h4>
                      <p className="text-sm text-teal-100 mt-1">{goal?.goal_description || 'Lead kids to make personal choices for Christ.'}</p>
                    </>
                  )}
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Decisions Target: {currentCount}/{targetCount} Souls</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-teal-900/60 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
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
                  <form onSubmit={handleRegisterDecision} className="space-y-3">
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
                <p className="text-[10px] text-gray-400 mt-1">{converts.length} Records registered</p>
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

            {/* Phase 3: Aquifer-powered Synced Curriculum Library */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-teal-800 tracking-tight flex items-center gap-2">
                    <BookOpen size={24} className="text-teal-650" /> Curriculum Library
                    <span className="text-[9px] font-black tracking-widest text-[#1CABB9] bg-[#1CABB9]/10 px-2.5 py-0.5 rounded-full border border-[#1CABB9]/25 animate-pulse">AQUIFER POWERED</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Browse study resources synchronized directly from the local database</p>
                </div>

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

              <form onSubmit={handleSearchCurriculum} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={curriculumSearchText}
                  onChange={e => setCurriculumSearchText(e.target.value)}
                  placeholder={`Search scripture or topic for ${curriculumTrack === 'kids' ? 'Kids' : 'Teens'} curriculum...`}
                  className="flex-grow text-xs border border-gray-250 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
                <button
                  type="submit"
                  disabled={isLoadingCurriculum}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoadingCurriculum ? 'Searching...' : 'Search'}
                </button>
              </form>

              {curriculumResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {curriculumResults.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-mono bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{item.usfm_start || item.ref}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{item.tier || 'Curriculum'}</span>
                        </div>
                        <h4 className="font-bold text-sm text-teal-900">{item.title}</h4>
                        <div className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed font-sans prose prose-sm" dangerouslySetInnerHTML={{ __html: item.content_html }}></div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-400">
                        <span>Tyndale Open Study Notes</span>
                        <button
                          onClick={() => {
                            setStudyNotesResults([item]);
                            setStudyNotesQuery(item.usfm_start || item.ref);
                            setStudyNotesSearched(true);
                            toast.success("Loaded note in detail search viewer below! 📖");
                          }}
                          className="text-teal-700 hover:underline font-black cursor-pointer"
                        >
                          View Details &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : curriculumSearchSearched && !isLoadingCurriculum ? (
                <p className="text-xs italic text-gray-400 text-center py-4">No specific curriculum matches found in this search query.</p>
              ) : (
                <div className="p-6 bg-teal-50/20 border border-dashed border-teal-200 rounded-2xl text-center text-xs text-teal-800">
                  Type a reference or topic to view corresponding study guides, lessons, and tools.
                </div>
              )}
            </div>

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
                  className="flex-grow text-xs border border-gray-255 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
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

            {/* Dynamic, Auto-populated Evangelism Resources */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-teal-800 tracking-tight">Evangelism Resources</h3>
                <span className="text-[10px] text-gray-400 italic font-medium">Auto-populated from Aquifer sync</span>
              </div>
              {isLoadingEvangelism ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="animate-pulse bg-gray-100 rounded-2xl h-24"></div>
                  <div className="animate-pulse bg-gray-100 rounded-2xl h-24"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evangelismResources.map((res, i) => (
                    <div key={i} className="p-5 bg-white border border-gray-150 rounded-2xl hover:border-teal-500 transition-all shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-teal-50 text-teal-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">{res.ref}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#372f58]">{res.title}</h4>
                        <div className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed font-sans prose prose-sm" dangerouslySetInnerHTML={{ __html: res.content_html }}></div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-teal-750 font-bold">
                        <span>Tyndale Guide Collection</span>
                        <button
                          onClick={() => {
                            setStudyNotesResults([res]);
                            setStudyNotesQuery(res.usfm_start || res.ref);
                            setStudyNotesSearched(true);
                            toast.success("Loaded note in detail search viewer below! 📖");
                          }}
                          className="hover:underline font-black cursor-pointer"
                        >
                          Read Guide &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bible Verse Spotlight */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-teal-200/60 relative overflow-hidden text-gray-700 animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 p-3 bg-teal-600 text-white rounded-bl-2xl">
                <Trophy size={18} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl text-teal-700 font-sans font-bold">Scripture for the Day</h3>
                {localStorage.getItem('ft_bible_streak') && (
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    <Flame size={14} className="fill-amber-500 text-amber-500" />
                    <span>{localStorage.getItem('ft_bible_streak')} DAY STREAK</span>
                  </div>
                )}
              </div>
              <VerseOfTheWeek versionId={12} />
            </div>

          </div>

          {/* Right Column (AI Assistant) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GeminiAssistant
                audience={Audience.TEACHERS}
                onSelectAction={(action) => {
                  if (action === 'altar_script') {
                    setIsAltarScriptModalOpen(true);
                  }
                }}
              />
            </div>
          </div>

        </div>

        {/* Dynamic Teacher Submodals */}
        {activeTeacherModal !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setActiveTeacherModal(null)}></div>
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-gray-100 flex flex-col max-h-[90vh]">

              <div className="bg-teal-700 px-6 py-4 flex justify-between items-center text-white shrink-0">
                <h3 className="text-base font-bold flex items-center gap-2">
                  {activeTeacherModal === 'convert' && <><Users size={18} /> New Convert Tracker</>}
                  {activeTeacherModal === 'decision' && <><ClipboardList size={18} /> Digital Decision Cards</>}
                  {activeTeacherModal === 'schedule' && <><Calendar size={18} /> Follow-up Scheduler</>}
                </h3>
                <button onClick={() => setActiveTeacherModal(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                {activeTeacherModal === 'convert' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 mb-2">Registered decisions during junior church services:</p>
                    {converts.length === 0 ? (
                      <p className="text-sm italic text-gray-400 text-center py-4">No records found.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {converts.map((con, i) => (
                          <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-start text-xs">
                            <div>
                              <p className="font-bold text-gray-800">{con.name}</p>
                              <p className="text-[10px] text-gray-550 mt-0.5">Notes: {con.class_notes || con.notes}</p>
                            </div>
                            <div className="text-right">
                              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-bold">Age: {con.age || 'N/A'}</span>
                              <p className="text-[10px] text-gray-450 mt-1">{new Date(con.registered_at || con.decisionDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTeacherModal === 'decision' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-gray-500 mb-2">Review Digital Decision cards for children follow-up and record keeping:</p>
                    
                    {converts.length === 0 ? (
                      <p className="text-sm italic text-gray-400 text-center py-4">No registered converts to generate cards for.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {converts.map((con, idx) => (
                          <div key={idx} className="border-2 border-dashed border-teal-600/35 p-4 rounded-xl bg-white shadow-sm flex flex-col justify-between min-h-[140px] text-left">
                            <div>
                              <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                                <span className="font-extrabold text-teal-800 tracking-wide text-[9px] uppercase">DECISION CARD</span>
                                <span className="text-[8px] text-gray-400 font-mono">#{idx + 1}</span>
                              </div>
                              <div className="py-2.5 space-y-1">
                                <p className="text-xs font-black text-[#372f58]">{con.name}</p>
                                <p className="text-[9px] text-gray-500">Age: <span className="font-bold">{con.age || 'N/A'}</span></p>
                                <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">"I have decided to follow Jesus Christ."</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400">
                              <span>Date: {new Date(con.registered_at || con.decisionDate).toLocaleDateString()}</span>
                              <span className="font-bold text-teal-600">Faith Tribe</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTeacherModal === 'schedule' && (
                  <div className="space-y-4 text-xs text-gray-650">
                    <p className="text-xs text-gray-500">Milestones checklists checklist (Filter: Active first 24 hr follows):</p>
                    {tasks.length === 0 ? (
                      <p className="text-sm italic text-gray-400 text-center py-4">No pending checklist follow-up tasks.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {tasks.map((taskItem) => (
                          <div key={taskItem.id} className="flex items-start gap-2.5 p-3.5 bg-gray-50 border border-gray-150 rounded-xl text-left">
                            <input
                              type="checkbox"
                              checked={taskItem.completed}
                              onChange={() => handleToggleTask(taskItem.id, taskItem.completed)}
                              className="mt-0.5 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`font-bold text-gray-800 ${taskItem.completed ? 'line-through text-gray-400' : ''}`}>{taskItem.task_description}</p>
                              <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-450 font-medium">
                                <span className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">Convert: {taskItem.convert_name}</span>
                                <span>Due: {new Date(taskItem.due_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-3.5 flex justify-end shrink-0 border-t border-gray-100">
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

        {/* Altar Call Script Modal (Phase 1.6) */}
        {isAltarScriptModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAltarScriptModalOpen(false)}></div>
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-gray-100 flex flex-col max-h-[90vh]">
              
              <div className="bg-[#372f58] px-6 py-4 flex justify-between items-center text-white shrink-0">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Flame size={18} className="text-[#F8B229]" /> Altar Call Script: RCCG ABC Method
                </h3>
                <button onClick={() => setIsAltarScriptModalOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-5 text-left text-sm leading-relaxed text-gray-700">
                <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl text-amber-800 text-xs">
                  <strong>RCCG Junior Church Standard:</strong> Use this script during Sunday altar calls. Speak slowly, inviting kids/teens to repeat each phrase from their hearts.
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-teal-600 pl-3">
                    <h4 className="font-extrabold text-[#372f58] text-xs uppercase tracking-wider">Step A: Admit (Repentance)</h4>
                    <p className="italic text-gray-600 mt-1">"Lord Jesus, I admit that I have sinned and gone my own way. I need Your forgiveness. I am sorry for my past life."</p>
                  </div>

                  <div className="border-l-4 border-teal-600 pl-3">
                    <h4 className="font-extrabold text-[#372f58] text-xs uppercase tracking-wider">Step B: Believe (Faith)</h4>
                    <p className="italic text-gray-600 mt-1">"I believe that You are the Son of God, and that You died on the cross to take away my sins, and rose again to give me life."</p>
                  </div>

                  <div className="border-l-4 border-teal-600 pl-3">
                    <h4 className="font-extrabold text-[#372f58] text-xs uppercase tracking-wider">Step C: Confess (Commitment)</h4>
                    <p className="italic text-gray-600 mt-1">"I confess You today as my Lord and Savior. Come into my heart, wash me clean, and lead me from this day forward. Amen."</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-150 space-y-2">
                  <h5 className="font-bold text-xs text-gray-800">Teacher's Follow-up Instructions:</h5>
                  <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
                    <li>Have the children fill out their Digital Decision Cards immediately.</li>
                    <li>Record their details in the "Register Decision" form to start the 24-hour follow-up scheduler.</li>
                    <li>Hand out the new convert welcomes package and booklets.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3.5 flex justify-end shrink-0 border-t border-gray-100">
                <button
                  onClick={() => setIsAltarScriptModalOpen(false)}
                  className="bg-[#372f58] hover:bg-[#282142] text-white font-bold text-xs px-4 py-2 rounded transition-colors cursor-pointer"
                >
                  Close Script
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
            <div className="flex items-center gap-0.5">
              <span>&copy; {new Date().getFullYear()} Faith Tribe</span>
              <img src="/Faith_Tribe_Grey-rbg.png" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" alt="Faith Tribe logo" />
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
