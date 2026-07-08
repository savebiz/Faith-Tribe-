import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Play, FileText, Music, Sparkles } from 'lucide-react';
import { getZoneLibrary, ZoneLibraryResult } from '../../lib/library/getZoneLibrary';

interface KidsLibraryViewProps {
  onBack: () => void;
}

export const KidsLibraryView: React.FC<KidsLibraryViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'stories' | 'songs' | 'activities'>('all');
  const [search, setSearch] = useState('');
  const [libraryData, setLibraryData] = useState<ZoneLibraryResult>({
    contentItems: [],
    bloomBooks: [],
    commentaries: [],
    studyNotes: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const categoryFilter = activeTab === 'all' ? undefined : activeTab;
      const data = await getZoneLibrary('kids', {
        search: search || undefined,
        category: categoryFilter
      });
      setLibraryData(data);
      setIsLoading(false);
    }
    loadData();
  }, [activeTab, search]);

  const categories = [
    { id: 'all', label: 'All Fun Stuff', icon: Sparkles, color: 'bg-amber-400 text-white' },
    { id: 'stories', label: 'Bible Stories', icon: BookOpen, color: 'bg-teal-500 text-white' },
    { id: 'songs', label: 'Songs & Praise', icon: Music, color: 'bg-indigo-500 text-white' },
    { id: 'activities', label: 'Color & Play', icon: FileText, color: 'bg-rose-500 text-white' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF0] to-[#E3F6F5] py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-teal-100 cursor-pointer text-xs"
        >
          <ArrowLeft size={16} />
          <span>BACK HOME</span>
        </button>
        <h1 className="text-3xl sm:text-4xl font-black text-[#2C6975] uppercase tracking-wider text-center flex-grow sm:flex-grow-0">
          Kids Tribe Library
        </h1>
        <div className="w-10 sm:w-24"></div> {/* Balance header */}
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search */}
        <div className="w-full max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search stories, videos, and games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 rounded-full border-2 border-teal-500/20 bg-white text-sm font-bold text-[#2C6975] shadow-lg focus:border-teal-500 focus:outline-none placeholder-teal-600/40"
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = activeTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md
                  ${isActive 
                    ? `${c.color} ring-4 ring-offset-2 ring-teal-300` 
                    : 'bg-white hover:bg-gray-50 text-gray-700'}`}
              >
                <Icon size={16} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-bounce p-5 bg-white rounded-full shadow-lg border border-gray-100">
              <Sparkles className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Bloom Storybooks Section */}
            {libraryData.bloomBooks.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#2C6975] uppercase tracking-wider">
                    Bloom Illustrated Storybooks
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {libraryData.bloomBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className="bg-white rounded-3xl overflow-hidden border-4 border-teal-500/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
                    >
                      {book.cover_url && (
                        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative">
                          <img 
                            src={book.cover_url} 
                            alt={book.title} 
                            className="w-full h-full object-cover"
                          />
                          {book.age_group && (
                            <span className="absolute top-4 right-4 bg-teal-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                              Age: {book.age_group}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-base font-black text-[#2C6975] line-clamp-1">{book.title}</h3>
                          <p className="text-xs text-gray-500 font-bold leading-relaxed line-clamp-2 mt-1">
                            {book.description || 'Enjoy this beautiful illustrated bible story.'}
                          </p>
                        </div>
                        {book.pdf_url && (
                          <a
                            href={book.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-md"
                          >
                            <BookOpen size={14} />
                            <span>Read Storybook</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video & Media Items */}
            {libraryData.contentItems.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#2C6975] uppercase tracking-wider">
                    Interactive Lessons & Videos
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {libraryData.contentItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-3xl overflow-hidden border-4 border-amber-400/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
                    >
                      {item.thumbnail_url && (
                        <div className="aspect-video w-full overflow-hidden bg-gray-50 relative">
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-4 left-4 bg-amber-400 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                            {item.type}
                          </span>
                        </div>
                      )}
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-base font-black text-[#2C6975] line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-gray-500 font-bold leading-relaxed line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>
                        {item.video_id ? (
                          <button
                            onClick={() => {
                              // Play video (e.g. open iframe modal or direct trigger)
                              window.open(`https://www.youtube.com/watch?v=${item.video_id}`, '_blank');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-md cursor-pointer"
                          >
                            <Play size={14} fill="currentColor" />
                            <span>Play Video</span>
                          </button>
                        ) : item.document_url ? (
                          <a
                            href={item.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-md"
                          >
                            <FileText size={14} />
                            <span>Open Activity</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              libraryData.bloomBooks.length === 0 && (
                <div className="text-center py-24 bg-white rounded-3xl border-4 border-dashed border-teal-500/10 max-w-md mx-auto">
                  <span className="text-4xl block mb-3">🔍</span>
                  <h3 className="text-sm font-black text-[#2C6975] uppercase tracking-wider">No matching content found</h3>
                  <p className="text-xs text-gray-400 mt-1">Try checking another filter or clearing your search!</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
