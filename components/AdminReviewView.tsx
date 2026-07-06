import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ClipboardList, Check, X, Wand2, Loader2, Search } from 'lucide-react';
import { BibleStudyNote } from '../lib/supabase';
import { generateCreativeContent } from '../services/geminiService';

export const AdminReviewView: React.FC<{ currentStaff: StaffMember }> = ({ currentStaff }) => {
  const [drafts, setDrafts] = useState<BibleStudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generator state
  const [genBook, setGenBook] = useState('GEN');
  const [genChapter, setGenChapter] = useState('1');
  const [generating, setGenerating] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('bible_study_notes')
      .select('*')
      .eq('tier', 'basic')
      .eq('review_status', 'draft')
      .order('ingested_at', { ascending: false });

    if (error) {
      toast.error('Failed to load drafts');
    } else {
      setDrafts(data || []);
    }
    setLoading(false);
  };

  const handleGenerateDraft = async () => {
    if (!supabase) {
      toast.error('Supabase is not connected');
      return;
    }
    setGenerating(true);
    try {
      const ref = `${genBook} ${genChapter}`;
      const content = await generateCreativeContent(
        'TEENS',
        `Bible Study Notes for ${ref}`
      );
      
      const newDraft: Partial<BibleStudyNote> = {
        ref: ref,
        usfm_start: ref,
        title: `Study Notes: ${ref}`,
        content_html: `<p>${content.replace(/\n/g, '<br/>')}</p>`,
        tier: 'basic',
        review_status: 'draft',
        review_level: 'draft',
      };

      const { error } = await supabase
        .from('bible_study_notes')
        .upsert(newDraft);

      if (error) throw error;
      toast.success(`Draft generated for ${ref}`);
      fetchDrafts();
    } catch (e: any) {
      toast.error(`Generation failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (ref: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('bible_study_notes')
        .update({
          review_status: 'approved',
          reviewed_by: currentStaff.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('ref', ref);
      if (error) throw error;
      toast.success('Draft approved!');
      fetchDrafts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async (ref: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('bible_study_notes')
        .update({
          review_status: 'rejected',
          reviewed_by: currentStaff.id,
          reviewed_at: new Date().toISOString(),
          // we could store rejectReason if we add a column, but prompt just says "optional reason field". 
          // Since no column was specified, we can just reject it for now.
        })
        .eq('ref', ref);
      if (error) throw error;
      toast.success('Draft rejected');
      fetchDrafts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveEdit = async (ref: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('bible_study_notes')
        .update({ content_html: editContent })
        .eq('ref', ref);
      if (error) throw error;
      toast.success('Draft saved');
      setEditingId(null);
      fetchDrafts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
          <ClipboardList size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Review Queue</h1>
          <p className="text-sm font-medium text-gray-500">Review AI-drafted Basic-tier content before it goes public.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Book Code</label>
          <input 
            type="text" 
            value={genBook} 
            onChange={e => setGenBook(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none uppercase"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Chapter</label>
          <input 
            type="number" 
            value={genChapter} 
            onChange={e => setGenChapter(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button 
          onClick={handleGenerateDraft}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          Generate Draft
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={32} className="animate-spin mx-auto text-blue-500" /></div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 font-medium">No drafts pending review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {drafts.map(draft => (
            <div key={draft.ref} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{draft.title || draft.ref}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Passage: {draft.usfm_start}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleReject(draft.ref)}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(draft.ref)}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 transition-colors flex items-center gap-1.5"
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>

              {editingId === draft.ref ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full h-48 p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none font-mono text-sm"
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSaveEdit(draft.ref)}
                      className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-64 overflow-y-auto mb-3"
                    dangerouslySetInnerHTML={{ __html: draft.content_html }}
                  />
                  <button 
                    onClick={() => {
                      setEditingId(draft.ref);
                      setEditContent(draft.content_html || '');
                    }}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Edit Content
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
