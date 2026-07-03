import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GeminiAssistant from './components/GeminiAssistant';
import ContentSection from './components/ContentSection';
import LiveStreamPlayer from './components/LiveStreamPlayer';
import { Audience, ContentItem } from './types';
import { 
  ArrowRight, Star, Zap, BookOpen, Users, Heart, Share2, X, Lock, Radio, 
  Smile, Shield, Calendar, ChevronRight, Plus, CheckCircle2, ClipboardList, 
  Send, Sparkles, Trophy, PlusCircle, Check, Instagram, Facebook, Youtube
} from 'lucide-react';
import { VerseOfTheWeek } from './lib/bible/VerseOfTheWeek';
import { BibleReaderView } from './lib/bible/BibleReaderView';

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
      return { view: Audience.KIDS, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/teens')) {
      return { view: Audience.TEENS, book: 'GEN', chapter: '1', versionId };
    } else if (path.startsWith('/teachers')) {
      return { view: Audience.TEACHERS, book: 'GEN', chapter: '1', versionId };
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
    else if (view === Audience.KIDS) path = '/kids';
    else if (view === Audience.TEENS) path = '/teens';
    else if (view === Audience.TEACHERS) path = '/teachers';
    else if (view === Audience.BIBLE) {
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
  
  // -- State for Live Stream Status (conditional UI) --
  const [broadcastStatus, setBroadcastStatus] = useState({
    isLive: false,
    title: "",
    watchUrl: ""
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/broadcast_status.json');
        if (res.ok) {
          const data = await res.json();
          setBroadcastStatus({
            isLive: !!data.is_live,
            title: data.title || "",
            watchUrl: data.watch_url || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch broadcast status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);
  
  // -- State for Prayer Request --
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [prayerRequest, setPrayerRequest] = useState('');

  // -- State for Teacher Auth --
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

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
    alert("Thank you! Your prayer request has been received. Our team will pray for you!");
    setPrayerRequest('');
    setIsPrayerModalOpen(false);
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherEmail && teacherPassword) {
      setIsTeacherLoggedIn(true);
    } else {
      alert("Please enter a valid email and password.");
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
              <button 
                onClick={() => navigateToView(Audience.KIDS)}
                className="w-auto rounded-full bg-[#F8B229] px-6 py-3 text-sm font-bold text-[#372f58] shadow-lg shadow-[#F8B229]/15 hover:bg-[#1CABB9] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#F8B229] text-center"
              >
                Explore Tribes
              </button>
            </div>
          </div>
          <div className="w-full flex justify-center lg:justify-end mt-6 sm:mt-12 lg:mt-0">
            <div className="w-full max-w-md sm:max-w-lg p-3 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-2xl flex">
              <img
                src="https://picsum.photos/seed/worship/800/500"
                alt="Worship screenshot"
                className="w-full aspect-[4/3] rounded-[2rem] shadow-xl object-cover"
              />
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
      <div className="py-24 bg-white/30 backdrop-blur-md border-t border-teal-100/50">
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
          Empowering the Next Generation <br className="hidden sm:inline"/>Through Faith
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

  const KidsView = () => (
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
              onClick={() => alert("Invite Card generated! Download and send to your friends.")}
              className="px-5 py-2.5 bg-amber-400 text-white font-black rounded-2xl hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-200 cursor-pointer text-sm shrink-0 border-b-4 border-amber-500"
            >
              Get Invite Card
            </button>
          </div>

          <ContentSection title="This Week's Fun" items={KIDS_CONTENT} colorTheme="text-amber-500" />
          
          {/* Bible Verse Spotlight */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-amber-200/60 relative overflow-hidden text-gray-700">
            <div className="absolute top-0 right-0 p-3 bg-amber-400 text-white rounded-bl-2xl">
              <Trophy size={18} />
            </div>
            <h3 className="text-2xl text-amber-600 mb-4">Verse of the Week</h3>
            <VerseOfTheWeek versionId={1932} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <GeminiAssistant audience={Audience.KIDS} />
          </div>
        </div>
      </div>
    </div>
  );

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
              onClick={() => alert("Invite link copied to clipboard! Share with your friends.")}
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
                onClick={() => alert("Loading sermon video...")}
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
            <h3 className="text-2xl text-emerald-600 mb-4 font-sans font-bold">Verse of the Week</h3>
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
    // -- Login Gate --
    if (!isTeacherLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg shadow-teal-200">
                <Lock className="text-white" size={24} />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-gray-900">
              Teachers Hub
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Access curriculum plans and manage discipleship tracking.
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
            <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-150">
              <form className="space-y-5" onSubmit={handleTeacherLogin}>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="teacher@faithtribe.org"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-teal-700 py-2.5 px-4 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

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
              onClick={() => setIsTeacherLoggedIn(false)}
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
                    <span>{Math.min(100, Math.round((newConverts.length/5)*100))}%</span>
                  </div>
                  <div className="w-full bg-teal-900/60 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (newConverts.length/5)*100)}%` }}
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

            <ContentSection title="Evangelism Resources" items={TEACHERS_CONTENT} colorTheme="text-teal-700" />

            {/* Bible Verse Spotlight */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-teal-200/60 relative overflow-hidden text-gray-700 animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 p-3 bg-teal-600 text-white rounded-bl-2xl">
                <Trophy size={18} />
              </div>
              <h3 className="text-2xl text-teal-700 mb-4 font-sans font-bold">Scripture for the Week</h3>
              <VerseOfTheWeek versionId={12} />
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
        {currentView === Audience.TEACHERS && <TeachersView />}
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
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full cursor-pointer hover:bg-[#1CABB9] transition-all hover:scale-110 flex items-center justify-center text-white" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full cursor-pointer hover:bg-[#1CABB9] transition-all hover:scale-110 flex items-center justify-center text-white" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full cursor-pointer hover:bg-[#1CABB9] transition-all hover:scale-110 flex items-center justify-center text-white" aria-label="YouTube">
                  <Youtube size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright & Attribution Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 pt-8 border-t border-[#4d4475] mb-8">
            <div className="flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()} RCCG Faith Tribe</span>
              <img src="/Faith_Tribe_Grey-rbg.png" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-white/10" alt="Faith Tribe logo" />
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
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-base font-extrabold flex items-center gap-2" id="prayer-modal-title">
                <Heart className="fill-current text-indigo-200" size={18} /> Request Prayer Support
              </h3>
              <button 
                onClick={() => setIsPrayerModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-5">
              <form onSubmit={handlePrayerSubmit}>
                <div className="mb-4">
                  <label htmlFor="request" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    How can our prayer squad lift you up?
                  </label>
                  <textarea 
                    id="request"
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl shadow-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm resize-none"
                    rows={4}
                    placeholder="Describe your needs, we will stand in faith with you..."
                    required
                  />
                </div>
                <div className="mt-5 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button 
                    type="submit" 
                    className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-500 transition-colors cursor-pointer sm:col-start-2"
                  >
                    Send Request
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsPrayerModalOpen(false)} 
                    className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors cursor-pointer sm:col-start-1 sm:mt-0"
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
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-200" />
                <span>Salvation Guide: The ABC Steps</span>
              </h3>
              <button onClick={resetSalvationModal} className="text-white/80 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Steps Progress Indicator */}
            <div className="bg-indigo-50 px-6 py-3.5 border-b border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${salvationStep >= 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-300'}`}>1</span>
                <span>Admit</span>
              </div>
              <div className="w-8 h-[2px] bg-indigo-200"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${salvationStep >= 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-300'}`}>2</span>
                <span>Believe</span>
              </div>
              <div className="w-8 h-[2px] bg-indigo-200"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${salvationStep >= 3 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-300'}`}>3</span>
                <span>Confess</span>
              </div>
            </div>

            {/* Modal Body / Steps Content */}
            <div className="p-6">
              {!salvationFormSubmitted ? (
                <>
                  {salvationStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <h4 className="font-extrabold text-indigo-900 text-sm">Step A: Admit</h4>
                        <p className="text-xs text-indigo-750 mt-1 leading-relaxed">
                          Admit that you have made mistakes and sinned. We all fall short, but admitting this opens our hearts to receive forgiveness.
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scripture Focus</span>
                        <p className="text-xs italic text-gray-600 mt-1 leading-relaxed">
                          "For all have sinned and fall short of the glory of God."
                        </p>
                        <p className="text-right text-[10px] font-bold text-gray-500 mt-1">- Romans 3:23</p>
                      </div>
                      <button 
                        onClick={() => setSalvationStep(2)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Next Step: Believe <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {salvationStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <h4 className="font-extrabold text-indigo-900 text-sm">Step B: Believe</h4>
                        <p className="text-xs text-indigo-750 mt-1 leading-relaxed">
                          Believe that Jesus is the Son of God, and that He died on the cross and rose from the grave to pay for your mistakes and give you eternal life.
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scripture Focus</span>
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
                          className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Next Step: Confess <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {salvationStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs">
                        <h4 className="font-extrabold text-indigo-900 text-sm">Step C: Confess & Commit</h4>
                        <p className="text-indigo-750 mt-1 leading-relaxed">
                          Confess Jesus as your Savior. Pray this prayer from your heart:
                        </p>
                        <p className="mt-2.5 italic font-bold text-indigo-950 bg-white/70 p-3 rounded-lg border border-indigo-100/50 leading-relaxed">
                          "Lord Jesus, I admit I have made mistakes. I believe You died for my sins and rose again. I ask You to come into my heart, wash me clean, and be my forever Savior. Thank you for saving me. Amen!"
                        </p>
                      </div>

                      <form onSubmit={handleSalvationSubmit} className="space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sign Your Decision Card</p>
                        <input 
                          type="text" 
                          required
                          value={salvationName}
                          onChange={e => setSalvationName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-600"
                        />
                        <input 
                          type="email" 
                          required
                          value={salvationEmail}
                          onChange={e => setSalvationEmail(e.target.value)}
                          placeholder="Your Email Address"
                          className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-600"
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
                            className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-150 flex items-center justify-center gap-1.5 cursor-pointer"
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
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-md cursor-pointer"
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

    </div>
  );
};

export default App;