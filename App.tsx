import React, { useState } from 'react';
import Navbar from './components/Navbar';
import GeminiAssistant from './components/GeminiAssistant';
import ContentSection from './components/ContentSection';
import LiveStreamPlayer from './components/LiveStreamPlayer';
import { Audience, ContentItem } from './types';
import { ArrowRight, Star, Zap, BookOpen, Users, Heart, Share2, X, Lock, Radio } from 'lucide-react';

// --- Mock Data ---
const KIDS_CONTENT: ContentItem[] = [
  { id: '1', title: 'Meet Your New Best Friend', description: 'Who is Jesus and why does He love you so much?', thumbnail: 'https://picsum.photos/seed/jesuslove/400/250', type: 'VIDEO' },
  { id: '2', title: 'David and Goliath: Tiny Courage', description: 'Learn how David faced the giant with God\'s help!', thumbnail: 'https://picsum.photos/seed/david/400/250', type: 'VIDEO' },
  { id: '3', title: 'The ABCs of Salvation', description: 'A fun activity to learn how to ask Jesus into your heart.', thumbnail: 'https://picsum.photos/seed/abc/400/250', type: 'ACTIVITY' },
];

const TEENS_CONTENT: ContentItem[] = [
  { id: '4', title: 'Why Faith? Why Now?', description: 'Is God real? A real talk for skeptics and seekers.', thumbnail: 'https://picsum.photos/seed/skeptic/400/250', type: 'VIDEO' },
  { id: '5', title: 'How to Share Without Being Cringe', description: 'Practical tips on inviting friends to Faith Tribe.', thumbnail: 'https://picsum.photos/seed/share/400/250', type: 'ARTICLE' },
  { id: '6', title: 'My Salvation Story', description: 'Community members share how they found purpose.', thumbnail: 'https://picsum.photos/seed/testimony/400/250', type: 'VIDEO' },
];

const TEACHERS_CONTENT: ContentItem[] = [
  { id: '7', title: 'The Art of the Altar Call', description: 'How to lead children to Christ effectively.', thumbnail: 'https://picsum.photos/seed/altar/400/250', type: 'ARTICLE' },
  { id: '8', title: 'Q3 Curriculum: The Great Commission', description: '12-week plan focused on outreach and evangelism.', thumbnail: 'https://picsum.photos/seed/plan/400/250', type: 'LESSON_PLAN' },
  { id: '9', title: 'Follow-Up Guide', description: 'What to do in the first 24 hours after a child gets saved.', thumbnail: 'https://picsum.photos/seed/followup/400/250', type: 'LESSON_PLAN' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<Audience>(Audience.HOME);
  
  // -- State for Prayer Request --
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [prayerRequest, setPrayerRequest] = useState('');

  // -- State for Teacher Auth --
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // -- State for Live Stream --
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState(false);

  // -- Handlers --
  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Prayer Request Submitted:", prayerRequest);
    alert("Your prayer request has been received. Our team will be praying for you!");
    setPrayerRequest('');
    setIsPrayerModalOpen(false);
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherEmail && teacherPassword) {
        // Mock authentication check
        setIsTeacherLoggedIn(true);
    } else {
        alert("Please enter a valid email and password.");
    }
  };

  // --- Views ---

  const HomeView = () => (
    <div className="bg-white">
      {/* Live Stream Banner (Conditional) */}
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center sm:px-6 lg:px-8 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setIsLiveStreamOpen(true)}>
          <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <p className="font-bold text-sm sm:text-base">LIVE NOW: Sunday Service - "Walking in Dominion"</p>
          </div>
          <button className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full font-bold transition-colors">
              WATCH
          </button>
      </div>

      {/* Hero */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Faith Tribe
              <span className="text-brand-primary block text-2xl sm:text-3xl font-medium mt-2">Win Souls. Raise Champions.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              The digital heartbeat of RCCG Region 63 Junior Church. A platform to encounter God, grow in faith, and bring others to the light.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <button 
                onClick={() => setCurrentView(Audience.KIDS)}
                className="rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Join the Tribe
              </button>
              <button onClick={() => window.open('https://bible.com', '_blank')} className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-1">
                Read Bible <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <img
                  src="https://picsum.photos/seed/worship/2432/1442"
                  alt="App screenshot"
                  width={2432}
                  height={1442}
                  className="w-[76rem] rounded-md shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soul Winning / New Here Section */}
      <div className="bg-brand-primary py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                Looking for Purpose?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                Whether you've grown up in church or are asking questions for the first time, Jesus invites you to a life of adventure and peace.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-white text-brand-primary px-6 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors">
                    Meet Jesus
                </button>
                <button 
                  onClick={() => setIsPrayerModalOpen(true)}
                  className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-bold hover:bg-white/10 transition-colors"
                >
                    Submit Prayer Request
                </button>
            </div>
        </div>
      </div>

      {/* Audience Selection */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-primary">Discipleship Tracks</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Find Your Tribe
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              
              {/* Kids Card */}
              <div 
                onClick={() => setCurrentView(Audience.KIDS)}
                className="flex flex-col cursor-pointer group hover:bg-kids-bg p-6 rounded-2xl transition-all duration-300"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-kids-primary">
                    <Star className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Faith Kids (2-12)
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Fun stories and songs that introduce children to the love of Jesus.</p>
                  <p className="mt-6">
                    <span className="text-sm font-semibold leading-6 text-brand-primary group-hover:text-amber-600">Enter Zone <span aria-hidden="true">→</span></span>
                  </p>
                </dd>
              </div>

              {/* Teens Card */}
              <div 
                onClick={() => setCurrentView(Audience.TEENS)}
                className="flex flex-col cursor-pointer group hover:bg-gray-100 p-6 rounded-2xl transition-all duration-300"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-teens-secondary">
                    <Zap className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Faith Teens (13-19)
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">A judgment-free zone to explore faith, ask hard questions, and invite friends.</p>
                  <p className="mt-6">
                    <span className="text-sm font-semibold leading-6 text-brand-primary group-hover:text-violet-600">Join Tribe <span aria-hidden="true">→</span></span>
                  </p>
                </dd>
              </div>

               {/* Teachers Card */}
               <div 
                onClick={() => setCurrentView(Audience.TEACHERS)}
                className="flex flex-col cursor-pointer group hover:bg-teachers-bg p-6 rounded-2xl transition-all duration-300"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-teachers-primary">
                    <BookOpen className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Faith Teachers
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Tools to teach the Word and track the spiritual growth of every child.</p>
                  <p className="mt-6">
                    <span className="text-sm font-semibold leading-6 text-brand-primary group-hover:text-teal-700">Access Hub <span aria-hidden="true">→</span></span>
                  </p>
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const KidsView = () => (
    <div className="bg-kids-bg min-h-screen pb-12">
        {/* Kids Hero */}
        <div className="bg-brand-accent p-8 rounded-b-[3rem] shadow-lg text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <circle cx="10" cy="10" r="20" fill="white" />
                    <circle cx="80" cy="80" r="15" fill="white" />
                 </svg>
             </div>
             <h1 className="text-4xl md:text-6xl font-display text-white font-bold drop-shadow-md mb-2">Faith Kids!</h1>
             <p className="text-white text-lg font-display">Jesus is my best friend 🦁</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                
                {/* Soul Winning Badge for Kids */}
                <div className="bg-white p-4 rounded-xl border-2 border-yellow-400 shadow-sm mb-6 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                            <Heart className="text-yellow-500 fill-current" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Bring a Friend!</h3>
                            <p className="text-sm text-gray-600">Invite someone to watch Faith Kids with you.</p>
                        </div>
                     </div>
                     <button className="px-4 py-2 bg-yellow-400 text-white font-bold rounded-lg hover:bg-yellow-500 text-sm">
                        Get Invite Card
                     </button>
                </div>

                <ContentSection title="This Week's Fun" items={KIDS_CONTENT} colorTheme="text-brand-accent" />
                
                {/* Featured Bible Verse */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-brand-accent mt-6">
                    <h3 className="text-xl font-display text-brand-accent mb-2">Verse of the Week</h3>
                    <p className="text-2xl text-gray-700 italic">"For God so loved the world..."</p>
                    <p className="text-right font-bold text-gray-500 mt-2">- John 3:16</p>
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
    <div className="bg-gray-900 min-h-screen text-gray-100 pb-12">
         {/* Teens Hero */}
         <div className="relative h-64 overflow-hidden">
            <img src="https://picsum.photos/seed/concert/1200/400" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent flex items-end">
                <div className="max-w-7xl mx-auto px-6 pb-6 w-full flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teens-primary to-teens-secondary">Faith Teens</h1>
                        <p className="text-gray-300 mt-2 text-xl">Unfiltered. Real. Christ-centered.</p>
                    </div>
                    <button className="hidden sm:flex items-center gap-2 bg-teens-primary text-gray-900 px-4 py-2 rounded-full font-bold hover:bg-emerald-400 transition">
                         <Share2 size={18} /> Invite Squad
                    </button>
                </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700">
                     <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Zap className="text-yellow-400" /> Topic of the Month
                     </h2>
                     <p className="text-lg text-gray-300">"Identity in a Filtered World"</p>
                     <div className="flex gap-3 mt-4">
                        <button className="px-4 py-2 bg-teens-secondary hover:bg-violet-600 rounded-lg text-white font-medium transition-colors">
                            Watch Message
                        </button>
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                            Invite a Friend to Watch
                        </button>
                     </div>
                </div>
                <ContentSection title="Latest Drops" items={TEENS_CONTENT} colorTheme="text-teens-primary" />
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
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <div className="h-14 w-14 rounded-full bg-teachers-primary flex items-center justify-center shadow-lg">
                             <Lock className="text-white" size={28} />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Teachers Hub Access
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Please sign in to access ministry resources and tools.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
                        <form className="space-y-6" onSubmit={handleTeacherLogin}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={teacherEmail}
                                        onChange={(e) => setTeacherEmail(e.target.value)}
                                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-teachers-primary focus:outline-none focus:ring-teachers-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={teacherPassword}
                                        onChange={(e) => setTeacherPassword(e.target.value)}
                                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-teachers-primary focus:outline-none focus:ring-teachers-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md border border-transparent bg-teachers-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teachers-primary focus:ring-offset-2 transition-colors"
                                >
                                    Sign in to Dashboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // -- Authenticated View --
    return (
    <div className="bg-gray-50 min-h-screen pb-12">
        <div className="bg-white border-b border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-teachers-secondary">Teachers Hub</h1>
                    <p className="text-gray-500">Equipping you to win souls and shape champions.</p>
                </div>
                <button 
                  onClick={() => setIsTeacherLoggedIn(false)}
                  className="text-sm text-gray-500 hover:text-red-500 underline"
                >
                    Sign Out
                </button>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <div className="bg-teal-50 border border-teal-100 p-6 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
                                <Users size={20} />
                                Upcoming Sunday: "The Good Shepherd"
                            </h2>
                            <p className="mt-2 text-teal-700">Focus: Salvation Call</p>
                        </div>
                        <span className="bg-white px-3 py-1 rounded text-teal-700 text-sm font-bold border border-teal-100">
                            Goal: 5 Souls
                        </span>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button className="px-4 py-2 bg-white text-teal-700 border border-teal-200 rounded-md font-medium text-sm hover:bg-teal-50">View Curriculum</button>
                        <button className="px-4 py-2 bg-teachers-primary text-white rounded-md font-medium text-sm hover:bg-teal-800">Print Altar Call Script</button>
                    </div>
                 </div>

                 <ContentSection title="Evangelism & Resources" items={TEACHERS_CONTENT} colorTheme="text-teachers-secondary" />
            </div>
            <div className="lg:col-span-1">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <h3 className="font-bold text-gray-900 mb-2">Soul Winning Tools</h3>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> New Convert Tracker
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Digital Decision Cards
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Follow-up Scheduler
                        </li>
                    </ul>
                </div>
                <div className="sticky top-24">
                    <GeminiAssistant audience={Audience.TEACHERS} />
                </div>
            </div>
        </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Navbar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onWatchLive={() => setIsLiveStreamOpen(true)}
      />
      
      <main className="flex-grow">
        {currentView === Audience.HOME && <HomeView />}
        {currentView === Audience.KIDS && <KidsView />}
        {currentView === Audience.TEENS && <TeensView />}
        {currentView === Audience.TEACHERS && <TeachersView />}
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div>
                <h4 className="text-xl font-bold mb-4">Faith Tribe</h4>
                <p className="text-gray-400 text-sm">RCCG Region 63 Junior Church.</p>
                <p className="text-gray-400 text-sm mt-2">Raising champions. Saving souls.</p>
             </div>
             <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li><button onClick={() => setCurrentView(Audience.KIDS)} className="hover:text-white">Kids</button></li>
                    <li><button onClick={() => setCurrentView(Audience.TEENS)} className="hover:text-white">Teens</button></li>
                    <li><button onClick={() => setCurrentView(Audience.TEACHERS)} className="hover:text-white">Teachers</button></li>
                </ul>
             </div>
             <div>
                <h4 className="text-lg font-semibold mb-4">Connect</h4>
                <div className="flex space-x-4">
                    {/* Social icons placeholders */}
                    <div className="w-8 h-8 bg-gray-700 rounded-full cursor-pointer hover:bg-brand-primary transition-colors"></div>
                    <div className="w-8 h-8 bg-gray-700 rounded-full cursor-pointer hover:bg-brand-primary transition-colors"></div>
                    <div className="w-8 h-8 bg-gray-700 rounded-full cursor-pointer hover:bg-brand-primary transition-colors"></div>
                </div>
             </div>
        </div>
        <div className="mt-12 text-center text-xs text-gray-600 border-t border-gray-800 pt-8">
            &copy; {new Date().getFullYear()} Faith Tribe RCCG. All rights reserved.
        </div>
      </footer>

      {/* Prayer Modal */}
      {isPrayerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsPrayerModalOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-brand-primary px-4 py-4 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg font-semibold leading-6 text-white flex items-center gap-2" id="modal-title">
                        <Heart className="fill-current" size={20} /> Prayer Request
                    </h3>
                    <button 
                        onClick={() => setIsPrayerModalOpen(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handlePrayerSubmit}>
                        <div className="mb-4">
                            <label htmlFor="request" className="block text-sm font-medium text-gray-700 mb-2">
                                How can we pray for you today?
                            </label>
                            <textarea 
                                id="request"
                                value={prayerRequest}
                                onChange={(e) => setPrayerRequest(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-shadow resize-none"
                                rows={5}
                                placeholder="Share your burdens, we are here to listen..."
                                required
                            />
                        </div>
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button 
                                type="submit" 
                                className="inline-flex w-full justify-center rounded-lg bg-brand-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                            >
                                Send Request
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsPrayerModalOpen(false)} 
                                className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
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