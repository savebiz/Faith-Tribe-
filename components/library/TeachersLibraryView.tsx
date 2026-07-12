import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search, Download, HelpCircle, FileText, Filter, Book, AlertCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { getZoneLibrary, ZoneLibraryResult } from '../../lib/library/getZoneLibrary';
import { BOOK_NAMES } from '../../lib/bible/bookCodes';
import { supabase } from '../../lib/supabase';

interface TeachersLibraryViewProps {
  onBack: () => void;
}

export const TeachersLibraryView: React.FC<TeachersLibraryViewProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState('MAT');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [resourceType, setResourceType] = useState<'all' | 'video' | 'reading' | 'document' | 'commentary' | 'note' | 'devotional'>('all');
  const [commentaryId, setCommentaryId] = useState<string>('all');
  
  const [libraryData, setLibraryData] = useState<ZoneLibraryResult>({
    contentItems: [],
    bloomBooks: [],
    commentaries: [],
    studyNotes: [],
    devotionals: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDevotionalId, setExpandedDevotionalId] = useState<string | null>(null);

  // List of active commentary sources
  const commentarySources = [
    { id: 'all', label: 'All Traditions' },
    { id: 'aquifer', label: 'Aquifer/Tyndale Notes' },
    { id: 'matthew-henry', label: 'Matthew Henry' },
    { id: 'adam-clarke', label: 'Adam Clarke' }
  ];

  // List of books for filtering
  const filterBooks = [
    { code: 'GEN', name: 'Genesis' },
    { code: 'PRO', name: 'Proverbs' },
    { code: 'MAT', name: 'Matthew' },
    { code: 'MRK', name: 'Mark' },
    { code: 'LUK', name: 'Luke' },
    { code: 'JHN', name: 'John' },
    { code: 'ROM', name: 'Romans' }
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getZoneLibrary('teachers', {
        search: search || undefined,
        type: resourceType === 'all' ? undefined : (resourceType as any),
        book: selectedBook,
        chapter: selectedChapter,
        commentaryId: commentaryId === 'all' ? undefined : commentaryId
      });
      setLibraryData(data);
      setIsLoading(false);
    }
    loadData();
  }, [search, selectedBook, selectedChapter, resourceType, commentaryId]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-850 py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm border border-gray-200 cursor-pointer text-xs"
          >
            <ArrowLeft size={14} />
            <span>BACK</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-teal-800 uppercase tracking-wider">
              Teachers Curriculum Library
            </h1>
            <p className="text-xs text-gray-500 font-bold">
              Manage notes, study plans, and class commentary guides.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:max-w-xs relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search lessons & resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-700 transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Filter size={16} className="text-teal-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-teal-800">
              Filter Options
            </h2>
          </div>

          {/* Passage Filter Grid */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Scripture Passage
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-teal-700"
              >
                {filterBooks.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={150}
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          {/* Resource Type */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Resource Type
            </label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'all', label: 'All Formats' },
                { id: 'document', label: 'Lesson Documents' },
                { id: 'commentary', label: 'Commentary Content' },
                { id: 'note', label: 'Study & Engagement Notes' },
                { id: 'devotional', label: 'OH Daily Devotionals' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setResourceType(type.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                    ${resourceType === type.id 
                      ? 'bg-teal-700/10 text-teal-800' 
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Commentary Tradition Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Commentary Tradition
            </label>
            <div className="flex flex-col gap-1.5">
              {commentarySources.map(source => (
                <button
                  key={source.id}
                  onClick={() => setCommentaryId(source.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                    ${commentaryId === source.id 
                      ? 'bg-teal-700/10 text-teal-800' 
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-24 bg-white rounded-3xl border border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-teal-700"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Commentaries & Devotionals Section */}
              {(libraryData.commentaries.length > 0 || libraryData.studyNotes.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <BookOpen size={14} />
                    <span>Scripture Guides ({BOOK_NAMES[selectedBook] || selectedBook} {selectedChapter})</span>
                  </h3>
                  
                  {/* Aquifer & Tyndale Notes */}
                  {libraryData.studyNotes.map((note, index) => (
                    <div key={`note-${index}`} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                            {note.resource_type || 'Study Notes'}
                          </span>
                          <h4 className="text-sm font-black text-gray-900 mt-1">{note.title}</h4>
                        </div>
                        {note.resource_collection_attribution && (
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                            Source: {note.resource_collection_attribution}
                          </span>
                        )}
                      </div>
                      <div 
                        className="text-xs text-gray-600 leading-relaxed font-serif prose max-w-none select-text"
                        dangerouslySetInnerHTML={{ __html: note.content_html }}
                      />
                    </div>
                  ))}

                  {/* HelloAO Commentary */}
                  {libraryData.commentaries.map((comm) => (
                    <div key={`comm-${comm.id}`} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                          <span className="bg-teal-100 text-teal-800 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                            Commentary
                          </span>
                          <h4 className="text-sm font-black text-gray-900 mt-1">{comm.commentary_name}</h4>
                        </div>
                        {comm.license_url && (
                          <a 
                            href={comm.license_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-teal-600 hover:underline flex items-center gap-1 bg-teal-50/50 px-2.5 py-1 rounded-lg"
                          >
                            <span>License Info</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div 
                        className="text-xs text-gray-600 leading-relaxed font-serif prose max-w-none select-text"
                        dangerouslySetInnerHTML={{ __html: comm.content }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Lesson Plans, Guides, Files */}
              {libraryData.contentItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>Curriculum Files & Handouts</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {libraryData.contentItems.map((item) => (
                      <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-start gap-4 hover:border-teal-700/25 transition-all">
                        <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                          <Book size={20} />
                        </div>
                        <div className="flex-grow space-y-1">
                          <span className="bg-gray-100 text-gray-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                            {item.type}
                          </span>
                          <h4 className="text-xs font-black text-gray-950 line-clamp-1">{item.title}</h4>
                          <p className="text-[10px] text-gray-400 font-bold line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                          {item.document_url && (
                            <a
                              href={item.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[9px] font-black text-teal-700 hover:underline pt-2 uppercase tracking-wider"
                            >
                              <Download size={10} />
                              <span>Download PDF</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Heavens Devotionals Section */}
              {(resourceType === 'all' || resourceType === 'devotional') && libraryData.devotionals.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <BookOpen size={14} />
                    <span>Open Heavens Daily Devotionals</span>
                  </h3>
                  
                  {libraryData.devotionals.map((dev) => {
                    const isExpanded = expandedDevotionalId === dev.id;
                    const videoUrl = dev.video_path && supabase
                      ? supabase.storage.from('devotional-media').getPublicUrl(dev.video_path).data.publicUrl
                      : null;
                    const audioUrl = dev.audio_path && supabase
                      ? supabase.storage.from('devotional-media').getPublicUrl(dev.audio_path).data.publicUrl
                      : null;

                    return (
                      <div key={dev.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 text-left">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedDevotionalId(isExpanded ? null : dev.id)}
                        >
                          <div>
                            <span className="bg-teal-100 text-teal-800 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                              Devotional
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 ml-2">
                              {new Date(dev.devotional_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <h4 className="text-sm font-black text-gray-900 mt-1">{dev.title}</h4>
                          </div>
                          <button className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700">
                            <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-150 space-y-6 animate-in fade-in duration-200">
                            {/* Media Player */}
                            {(videoUrl || audioUrl) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {videoUrl && (
                                  <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-teal-700 tracking-wider">Video Narration & Scenes</span>
                                    <div className="aspect-video rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm">
                                      <video src={videoUrl} controls className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}
                                {audioUrl && (
                                  <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-teal-700 tracking-wider">Audio Narration Only</span>
                                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col justify-center h-full max-h-[120px] shadow-sm">
                                      <audio src={audioUrl} controls className="w-full" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Devotional Info */}
                            {dev.memory_verse && (
                              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block mb-1">
                                  Memory Verse ({dev.memory_verse_ref})
                                </span>
                                <p className="text-sm font-semibold text-gray-750 italic">
                                  "{dev.memory_verse}"
                                </p>
                              </div>
                            )}

                            {dev.bible_reading_ref && (
                              <div className="bg-blue-50/30 border border-blue-100/60 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-blue-600 tracking-wider block mb-1">
                                  Bible Reading
                                </span>
                                <p className="text-sm font-extrabold text-gray-800">
                                  {dev.bible_reading_ref}
                                </p>
                              </div>
                            )}

                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-gray-450 tracking-wider block">
                                Message Body
                              </span>
                              <p className="text-sm text-gray-700 leading-relaxed font-serif whitespace-pre-line select-text">
                                {dev.body_content}
                              </p>
                            </div>

                            {dev.prayer_point && (
                              <div className="bg-red-50/30 border border-red-100/60 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-red-650 tracking-wider block mb-1">
                                  Prayer Point
                                </span>
                                <p className="text-sm font-bold text-gray-700 italic">
                                  {dev.prayer_point}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {libraryData.commentaries.length === 0 && libraryData.studyNotes.length === 0 && libraryData.contentItems.length === 0 && libraryData.devotionals.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">No resources matched</h3>
                  <p className="text-xs text-gray-400 mt-1">Try resetting your book filter or commentary tradition.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
