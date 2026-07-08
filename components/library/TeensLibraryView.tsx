import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Hash, ArrowUpRight, Search, Play, FileText, ChevronDown } from 'lucide-react';
import { getZoneLibrary, ZoneLibraryResult } from '../../lib/library/getZoneLibrary';
import { StudyNote } from '../StudyNote';

interface TeensLibraryViewProps {
  onBack: () => void;
}

export const TeensLibraryView: React.FC<TeensLibraryViewProps> = ({ onBack }) => {
  const [activeTag, setActiveTag] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [libraryData, setLibraryData] = useState<ZoneLibraryResult>({
    contentItems: [],
    bloomBooks: [],
    commentaries: [],
    studyNotes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);

  // Hardcoded popular topics for Teens
  const popularTopics = [
    { id: 'all', label: 'All Topics' },
    { id: 'identity', label: 'Identity' },
    { id: 'purpose', label: 'Purpose' },
    { id: 'friendship', label: 'Friendships' },
    { id: 'faith', label: 'Faith' },
    { id: 'doubt', label: 'Overcoming Doubt' }
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const categoryFilter = activeTag === 'all' ? undefined : activeTag;
      const data = await getZoneLibrary('teens', {
        search: search || undefined,
        category: categoryFilter
      });
      setLibraryData(data);
      setIsLoading(false);
    }
    loadData();
  }, [activeTag, search]);

  return (
    <div className="min-h-screen bg-[#0F0C1B] text-gray-100 py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-2xl hover:bg-white/10 active:scale-95 transition-all shadow-xl cursor-pointer text-xs uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          <span>BACK</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 uppercase tracking-widest text-center">
          TEENS LIBRARY
        </h1>
        <div className="w-16"></div> {/* Balance header */}
      </div>

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Search */}
        <div className="w-full max-w-lg mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guides, podcasts, videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors shadow-2xl"
          />
        </div>

        {/* Hot Topics Carousel */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {popularTopics.map((topic) => {
            const isActive = activeTag === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTag(topic.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer border
                  ${isActive 
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white shadow-lg shadow-violet-500/20' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
              >
                <Hash size={12} />
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-violet-500"></div>
          </div>
        ) : (
          <div className="space-y-14">
            {/* Guides and Podcast Media */}
            {libraryData.contentItems.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase tracking-wider text-violet-400">
                  Featured Study Guides & Media
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {libraryData.contentItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-violet-500/40 transition-all group"
                    >
                      {item.thumbnail_url && (
                        <div className="aspect-video w-full overflow-hidden bg-gray-950 relative">
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-4 left-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg">
                            {item.type}
                          </span>
                        </div>
                      )}
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-black text-white group-hover:text-violet-400 transition-colors line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-gray-400 font-bold leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        {item.video_id ? (
                          <button
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${item.video_id}`, '_blank')}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-lg shadow-violet-950/20"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Play Video</span>
                          </button>
                        ) : item.document_url ? (
                          <a
                            href={item.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all border border-white/10"
                          >
                            <FileText size={12} />
                            <span>Read Guide</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In-depth Bible Study Notes (from Aquifer / Sunday Verse overrides) */}
            {libraryData.studyNotes.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-black uppercase tracking-wider text-fuchsia-400">
                  Scripture Insights & Devotional Notes
                </h2>
                <div className="space-y-4">
                  {libraryData.studyNotes.map((note, index) => {
                    const isExpanded = expandedNoteId === index;
                    return (
                      <div 
                        key={index} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-fuchsia-500/30 transition-all"
                      >
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedNoteId(isExpanded ? null : index)}
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">
                              {note.ref}
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-white">
                              {note.title}
                            </h3>
                          </div>
                          <button className="p-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white">
                            <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-200">
                            <StudyNote note={note} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {libraryData.contentItems.length === 0 && libraryData.studyNotes.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 max-w-sm mx-auto">
                <span className="text-3xl block mb-2">🔭</span>
                <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">No matching teen content</h3>
                <p className="text-xs text-gray-500 mt-1">Try another filter option above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
