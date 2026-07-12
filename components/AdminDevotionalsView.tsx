import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  BookOpen, Check, X, RefreshCw, Play, Volume2, 
  Loader2, Edit3, Trash2, Calendar, Link2, AlertTriangle, CheckCircle 
} from 'lucide-react';

interface Devotional {
  id: string;
  devotional_type: 'open_heavens_teens' | 'open_heavens_general';
  zone: 'teens' | 'teachers';
  devotional_date: string;
  title: string;
  memory_verse: string | null;
  memory_verse_ref: string | null;
  bible_reading_ref: string | null;
  body_content: string;
  prayer_point: string | null;
  source_url: string;
  status: 'draft' | 'approved' | 'published' | 'rejected';
  video_path: string | null;
  audio_path: string | null;
  scraped_at: string;
}

export const AdminDevotionalsView: React.FC<{ currentStaff: StaffMember }> = ({ currentStaff }) => {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMemoryVerse, setEditMemoryVerse] = useState('');
  const [editMemoryVerseRef, setEditMemoryVerseRef] = useState('');
  const [editReadingRef, setEditReadingRef] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editPrayer, setEditPrayer] = useState('');

  // Media URLs Cache
  const [mediaUrls, setMediaUrls] = useState<Record<string, { videoUrl: string | null; audioUrl: string | null }>>({});

  // Scraper Trigger state
  const [scraping, setScraping] = useState(false);
  const [generatingMediaId, setGeneratingMediaId] = useState<string | null>(null);

  useEffect(() => {
    fetchDevotionals();
  }, [activeTab]);

  const fetchDevotionals = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select('*')
        .eq('status', activeTab)
        .order('devotional_date', { ascending: false });

      if (error) throw error;
      setDevotionals(data || []);

      // Get public URLs for media paths
      const urls: Record<string, { videoUrl: string | null; audioUrl: string | null }> = {};
      if (data) {
        for (const item of data) {
          let videoUrl = null;
          let audioUrl = null;
          if (item.video_path) {
            const { data: vData } = supabase.storage.from('devotional-media').getPublicUrl(item.video_path);
            videoUrl = vData?.publicUrl || null;
          }
          if (item.audio_path) {
            const { data: aData } = supabase.storage.from('devotional-media').getPublicUrl(item.audio_path);
            audioUrl = aData?.publicUrl || null;
          }
          urls[item.id] = { videoUrl, audioUrl };
        }
      }
      setMediaUrls(urls);
    } catch (e: any) {
      toast.error(`Failed to load devotionals: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeToday = async () => {
    setScraping(true);
    try {
      // Get the current user's session token for server-side auth verification
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token || '';

      const res = await fetch('/api/scrape-devotionals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Successfully completed scrape run for today!");
        fetchDevotionals();
      } else {
        toast.error(`Scrape incomplete: ${data.errors?.join(', ')}`);
      }
    } catch (e: any) {
      toast.error(`Scraping failed: ${e.message}`);
    } finally {
      setScraping(false);
    }
  };

  const handleGenerateMedia = async (id: string) => {
    setGeneratingMediaId(id);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token || '';

      const res = await fetch(`/api/generate-devotional-video?devotionalId=${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Audio and video narration successfully generated!");
        fetchDevotionals();
      } else {
        toast.error(`Media generation failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`Media generation failed: ${e.message}`);
    } finally {
      setGeneratingMediaId(null);
    }
  };

  const handleStartEdit = (dev: Devotional) => {
    setEditingId(dev.id);
    setEditTitle(dev.title);
    setEditMemoryVerse(dev.memory_verse || '');
    setEditMemoryVerseRef(dev.memory_verse_ref || '');
    setEditReadingRef(dev.bible_reading_ref || '');
    setEditBody(dev.body_content);
    setEditPrayer(dev.prayer_point || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('devotionals')
        .update({
          title: editTitle,
          memory_verse: editMemoryVerse || null,
          memory_verse_ref: editMemoryVerseRef || null,
          bible_reading_ref: editReadingRef || null,
          body_content: editBody,
          prayer_point: editPrayer || null,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Devotional text updated successfully.');
      setEditingId(null);
      fetchDevotionals();
    } catch (e: any) {
      toast.error(`Failed to update devotional: ${e.message}`);
    }
  };

  const handleApproveAndPublish = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('devotionals')
        .update({
          status: 'published',
          reviewed_by: currentStaff.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Devotional published successfully!');
      fetchDevotionals();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm("Are you sure you want to reject this devotional? It will not be visible on the public library.")) return;
    try {
      const { error } = await supabase
        .from('devotionals')
        .update({
          status: 'rejected',
          reviewed_by: currentStaff.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Devotional rejected.');
      fetchDevotionals();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-8 text-gray-700 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Open Heavens Devotional Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scrape, review, edit, and generate premium media for daily devotionals.</p>
        </div>

        <button
          onClick={handleScrapeToday}
          disabled={scraping}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-750 text-white font-bold rounded-2xl hover:bg-indigo-850 transition-all shadow-md shadow-indigo-150 cursor-pointer text-sm shrink-0 disabled:opacity-50"
        >
          {scraping ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          <span>Scrape Today's Devotional</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'draft'
              ? 'border-indigo-600 text-indigo-650'
              : 'border-transparent text-gray-400 hover:text-gray-650'
          }`}
        >
          Pending Review (Drafts)
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'published'
              ? 'border-indigo-600 text-indigo-650'
              : 'border-transparent text-gray-400 hover:text-gray-650'
          }`}
        >
          Published Devotionals
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-gray-150 text-center">
          <Loader2 size={36} className="animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-sm font-bold text-gray-500">Loading devotionals queue...</p>
        </div>
      ) : devotionals.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-gray-150 text-center">
          <p className="text-gray-500 font-bold">No devotionals found in this queue.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {devotionals.map(dev => {
            const isEditing = editingId === dev.id;
            const media = mediaUrls[dev.id] || { videoUrl: null, audioUrl: null };
            const isGenerating = generatingMediaId === dev.id;

            return (
              <div 
                key={dev.id} 
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-150"
              >
                {/* Text Editing Column */}
                <div className="flex-1 p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                        dev.devotional_type === 'open_heavens_teens' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {dev.devotional_type === 'open_heavens_teens' ? 'Teens' : 'General/Teachers'}
                      </span>
                      <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        <Calendar size={13} />
                        <span>{new Date(dev.devotional_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {dev.status === 'draft' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(dev.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X size={14} /> Reject
                        </button>
                        <button
                          onClick={() => handleApproveAndPublish(dev.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-750 hover:bg-green-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check size={14} /> Approve & Publish
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 text-xs font-bold">
                      <div>
                        <label className="block text-gray-500 mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-500 mb-1">Memory Verse Text</label>
                          <textarea
                            value={editMemoryVerse}
                            onChange={e => setEditMemoryVerse(e.target.value)}
                            className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none h-16"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1">Memory Verse Ref</label>
                          <input
                            type="text"
                            value={editMemoryVerseRef}
                            onChange={e => setEditMemoryVerseRef(e.target.value)}
                            className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g. Psalm 23:1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-500 mb-1">Bible Reading Ref</label>
                        <input
                          type="text"
                          value={editReadingRef}
                          onChange={e => setEditReadingRef(e.target.value)}
                          className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g. Genesis 1:1-5"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-500 mb-1">Teaching Message</label>
                        <textarea
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none h-48 font-serif"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-500 mb-1">Prayer Point</label>
                        <input
                          type="text"
                          value={editPrayer}
                          onChange={e => setEditPrayer(e.target.value)}
                          className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(dev.id)}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                        >
                          Save Text Updates
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{dev.title}</h3>
                        <a 
                          href={dev.source_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-650 font-bold mt-1"
                        >
                          <Link2 size={10} />
                          <span>View Original Source Page</span>
                        </a>
                      </div>

                      {dev.memory_verse && (
                        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                          <p className="text-xs font-black uppercase text-amber-700 tracking-wider mb-1">Memory Verse</p>
                          <p className="text-sm font-semibold text-gray-750 font-serif leading-relaxed italic">
                            "{dev.memory_verse}"
                          </p>
                          {dev.memory_verse_ref && (
                            <p className="text-xs font-black text-amber-800 mt-1.5 text-right">— {dev.memory_verse_ref}</p>
                          )}
                        </div>
                      )}

                      {dev.bible_reading_ref && (
                        <div className="bg-blue-50/30 border border-blue-100/60 p-4 rounded-2xl flex items-center gap-3">
                          <BookOpen className="text-blue-600 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Bible Reading</p>
                            <p className="text-sm font-extrabold text-gray-800">{dev.bible_reading_ref}</p>
                          </div>
                        </div>
                      )}

                      <div className="prose prose-sm max-w-none bg-gray-50/50 p-6 rounded-2xl border border-gray-150 max-h-72 overflow-y-auto">
                        <p className="text-xs font-black uppercase text-gray-450 tracking-wider mb-2">Teaching Text</p>
                        <p className="text-sm text-gray-700 leading-relaxed font-serif whitespace-pre-line">
                          {dev.body_content}
                        </p>
                      </div>

                      {dev.prayer_point && (
                        <div className="bg-red-50/30 border border-red-100/60 p-4 rounded-2xl">
                          <p className="text-xs font-black uppercase text-red-650 tracking-wider mb-1">Prayer Point</p>
                          <p className="text-sm font-bold text-gray-700 italic">
                            {dev.prayer_point}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => handleStartEdit(dev)}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-650 hover:underline cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Edit Text Content</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Media Preview Column */}
                <div className="w-full lg:w-80 p-6 bg-gray-50/50 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Generated Media Preview</h4>

                    {media.videoUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black aspect-video relative flex items-center justify-center">
                        <video 
                          src={media.videoUrl} 
                          controls 
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-250 bg-gray-50 py-8 px-4 text-center">
                        <AlertTriangle className="text-gray-400 mx-auto mb-2" size={24} />
                        <p className="text-xs font-bold text-gray-500">No video generated yet.</p>
                      </div>
                    )}

                    {media.audioUrl && (
                      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Volume2 size={16} />
                          <span className="text-xs font-black uppercase tracking-wider">Audio Narration</span>
                        </div>
                        <audio src={media.audioUrl} controls className="w-full h-8 accent-indigo-600" />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleGenerateMedia(dev.id)}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Generating Media Pipeline...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>{media.videoUrl ? 'Regenerate Media' : 'Generate Daily Video & Audio'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
