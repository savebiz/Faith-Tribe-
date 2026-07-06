import React, { useState, useEffect } from 'react';
import { DbContentItem, StaffMember } from '../types';
import { fetchContentItems, upsertContentItem, deleteContentItem } from '../lib/supabase';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search, Calendar, Film, BookOpen, 
  FileText, PenTool, Image, AlertCircle, Sparkles, X, Check, Link as LinkIcon, Video, Type
} from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from './admin/RichTextEditor';

interface AdminContentViewProps {
  currentStaff: StaffMember;
}

export const AdminContentView: React.FC<AdminContentViewProps> = ({ currentStaff }) => {
  const [items, setItems] = useState<DbContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<DbContentItem> | null>(null);
  
  // Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<DbContentItem | null>(null);

  // Form Fields
  const [formZone, setFormZone] = useState<'kids' | 'teens' | 'teachers'>('kids');
  const [formType, setFormType] = useState<'video' | 'reading' | 'writing' | 'painting' | 'document'>('video');
  const [editorMode, setEditorMode] = useState<'markdown' | 'richtext'>('markdown');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'scheduled' | 'published' | 'archived'>('draft');
  const [formPublishDate, setFormPublishDate] = useState('');
  const [formUnpublishDate, setFormUnpublishDate] = useState('');

  // Video Fields
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [formVideoSource, setFormVideoSource] = useState<'youtube' | 'vimeo'>('youtube');
  const [formVideoId, setFormVideoId] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Reading Fields
  const [formStoryContent, setFormStoryContent] = useState('');

  // Writing Fields
  const [formWritingPrompt, setFormWritingPrompt] = useState('');

  // Painting Fields
  const [formColoringImageUrl, setFormColoringImageUrl] = useState('');

  // Document Fields
  const [formDocumentUrl, setFormDocumentUrl] = useState('');

  const isZoneManager = currentStaff.role === 'zone_manager';
  const managerZone = currentStaff.scoped_zone;

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch all content items
      const data = await fetchContentItems();
      
      // If zone manager, filter client-side just in case RLS hasn't done it
      if (isZoneManager && managerZone) {
        setItems(data.filter(item => item.zone === managerZone));
        setFormZone(managerZone);
      } else {
        setItems(data);
      }
    } catch (e: any) {
      toast.error(`Failed to fetch content items: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle oEmbed link paste for video auto-fetch
  const handleVideoUrlBlur = async () => {
    if (!videoUrlInput.trim()) return;
    
    try {
      setIsFetchingMetadata(true);
      const url = videoUrlInput.trim();
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      const isVimeo = url.includes('vimeo.com');

      if (isYouTube) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        if (!videoId) throw new Error('Invalid YouTube URL');

        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oembedUrl);
        if (!res.ok) throw new Error('Failed to fetch oEmbed metadata');
        const data = await res.json();
        
        setFormVideoSource('youtube');
        setFormVideoId(videoId);
        setFormTitle(data.title || '');
        setFormThumbnailUrl(data.thumbnail_url || '');
        toast.success('Successfully auto-fetched YouTube video details!');
      } else if (isVimeo) {
        const match = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
        const videoId = match ? match[3] : null;
        if (!videoId) throw new Error('Invalid Vimeo URL');

        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl);
        if (!res.ok) throw new Error('Failed to fetch Vimeo metadata');
        const data = await res.json();
        
        setFormVideoSource('vimeo');
        setFormVideoId(videoId);
        setFormTitle(data.title || '');
        setFormThumbnailUrl(data.thumbnail_url || '');
        
        const secs = data.duration || 0;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        setFormDuration(`${m}:${String(s).padStart(2, '0')}`);
        toast.success('Successfully auto-fetched Vimeo video details!');
      } else {
        toast.error('Unrecognized video link. Please enter YouTube or Vimeo URLs.');
      }
    } catch (err: any) {
      toast.error(`Auto-fetch metadata failed: ${err.message}. You can fill in the fields manually.`);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleOpenForm = (item?: DbContentItem) => {
    if (item) {
      setSelectedItem(item);
      setFormZone(item.zone);
      setFormType(item.type);
      setFormTitle(item.title);
      setFormDescription(item.description || '');
      setFormThumbnailUrl(item.thumbnail_url || '');
      setFormStatus(item.status);
      setFormPublishDate(item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : '');
      setFormUnpublishDate(item.unpublish_date ? new Date(item.unpublish_date).toISOString().slice(0, 16) : '');
      
      // Type specific loads
      setVideoUrlInput(item.video_source === 'youtube' ? `https://youtube.com/watch?v=${item.video_id}` : item.video_source === 'vimeo' ? `https://vimeo.com/${item.video_id}` : '');
      setFormVideoSource(item.video_source as any || 'youtube');
      setFormVideoId(item.video_id || '');
      setFormDuration(item.duration || '');
      setFormStoryContent(item.story_content || '');
      setFormWritingPrompt(item.writing_prompt || '');
      setFormColoringImageUrl(item.coloring_image_url || '');
      setFormDocumentUrl(item.document_url || '');
    } else {
      setSelectedItem(null);
      setFormZone(isZoneManager && managerZone ? managerZone : 'kids');
      setFormType('video');
      setFormTitle('');
      setFormDescription('');
      setFormThumbnailUrl('');
      setFormStatus('draft');
      setFormPublishDate('');
      setFormUnpublishDate('');
      setVideoUrlInput('');
      setFormVideoSource('youtube');
      setFormVideoId('');
      setFormDuration('');
      setFormStoryContent('');
      setFormWritingPrompt('');
      setFormColoringImageUrl('');
      setFormDocumentUrl('');
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Title is required.');
      return;
    }

    try {
      const payload: Partial<DbContentItem> = {
        id: selectedItem?.id,
        zone: formZone,
        type: formType,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        thumbnail_url: formThumbnailUrl.trim() || null,
        status: formStatus,
        publish_date: formPublishDate ? new Date(formPublishDate).toISOString() : null,
        unpublish_date: formUnpublishDate ? new Date(formUnpublishDate).toISOString() : null,
      };

      // Type specific payloads
      if (formType === 'video') {
        payload.video_source = formVideoSource;
        payload.video_id = formVideoId.trim();
        payload.duration = formDuration.trim() || null;
      } else if (formType === 'reading') {
        payload.story_content = formStoryContent;
      } else if (formType === 'writing') {
        payload.writing_prompt = formWritingPrompt.trim();
      } else if (formType === 'painting') {
        payload.coloring_image_url = formColoringImageUrl.trim();
      } else if (formType === 'document') {
        payload.document_url = formDocumentUrl.trim();
      }

      await upsertContentItem(payload);
      toast.success(selectedItem?.id ? 'Content item updated!' : 'New content item created!');
      setIsOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(`Failed to save content: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteContentItem(id);
      toast.success('Content item deleted successfully.');
      await loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      if (filterZone !== 'all' && item.zone !== filterZone) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'scheduled') {
          return item.status === 'scheduled' || (item.status === 'published' && item.publish_date && new Date(item.publish_date) > new Date());
        }
        return item.status === filterStatus;
      }
      return true;
    });
  };

  const getStatusBadge = (item: DbContentItem) => {
    const isFuture = item.publish_date && new Date(item.publish_date) > new Date();
    if (item.status === 'published' && isFuture) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-150">
          <Calendar size={12} />
          <span>Scheduled</span>
        </span>
      );
    }
    
    switch (item.status) {
      case 'published':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-150"><Eye size={12} /><span>Published</span></span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-150"><EyeOff size={12} /><span>Draft</span></span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-150"><span>Archived</span></span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film size={16} className="text-red-500" />;
      case 'reading': return <BookOpen size={16} className="text-blue-500" />;
      case 'writing': return <PenTool size={16} className="text-purple-500" />;
      case 'painting': return <Image size={16} className="text-teal-500" />;
      default: return <FileText size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8 text-gray-700 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Zone Content Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Publish interactive cards, readings, activities, and documents across Kids, Teens, and Teachers zones.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-800 hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-teal-100 cursor-pointer text-sm shrink-0"
        >
          <Plus size={18} />
          <span>Create Content</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Filters:</span>
        </div>

        {/* Zone Filter (hidden/disabled for zone managers) */}
        {!isZoneManager && (
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold focus:border-teal-600 focus:outline-none"
          >
            <option value="all">All Zones</option>
            <option value="kids">Kids Zone</option>
            <option value="teens">Teens Tribe</option>
            <option value="teachers">Teachers Hub</option>
          </select>
        )}

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold focus:border-teal-600 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="reading">Readings (Stories)</option>
          <option value="writing">Writings</option>
          <option value="painting">Colorings</option>
          <option value="document">Documents</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold focus:border-teal-600 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled Only</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center">
          <p className="text-sm font-bold text-gray-500">Loading content database...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Content Title</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Zone</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Type</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">Publish Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getFilteredItems().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-semibold">
                      No content items found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  getFilteredItems().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt={item.title} className="w-12 h-8 rounded-lg object-cover bg-gray-150" />
                          ) : (
                            <div className="w-12 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              {getTypeIcon(item.type)}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-bold text-gray-900 block max-w-xs md:max-w-md truncate">{item.title}</span>
                            {item.description && <span className="text-xs text-gray-500 font-medium block truncate max-w-xs md:max-w-md">{item.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {item.zone}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm font-semibold capitalize">
                          {getTypeIcon(item.type)}
                          <span>{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-500">
                        {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : 'Immediate'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                        <button
                          onClick={() => { setPreviewItem(item); setIsPreviewOpen(true); }}
                          className="text-teal-600 hover:text-teal-800 cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="text-indigo-600 hover:text-indigo-800 cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Edit size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="text-red-500 hover:text-red-700 cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">
                  {selectedItem?.id ? 'Edit Content Item' : 'Create Content Item'}
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Zone Select (hidden/pre-selected for zone managers) */}
                {!isZoneManager ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Target Zone</label>
                    <select
                      value={formZone}
                      onChange={(e) => setFormZone(e.target.value as any)}
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-teal-600 focus:outline-none"
                    >
                      <option value="kids">Kids Zone</option>
                      <option value="teens">Teens Tribe</option>
                      <option value="teachers">Teachers Hub</option>
                    </select>
                  </div>
                ) : null}

                {/* Content Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Content Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-teal-600 focus:outline-none"
                  >
                    <option value="video">Video Embed</option>
                    <option value="reading">Reading (Story Markdown)</option>
                    <option value="writing">Writing Prompt</option>
                    <option value="painting">Coloring Outlines</option>
                    <option value="document">Document Outline</option>
                  </select>
                </div>

                {/* Video specific oEmbed paste input */}
                {formType === 'video' && (
                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1">
                      <Sparkles size={14} className="text-red-500" />
                      <span>YouTube/Vimeo oEmbed Auto-Fetch</span>
                    </label>
                    <input
                      type="text"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      onBlur={handleVideoUrlBlur}
                      placeholder="Paste link e.g. https://www.youtube.com/watch?v=..."
                      className="block w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none bg-white font-medium"
                    />
                    <p className="text-[10px] text-red-500 font-semibold">
                      Paste a link and tab/blur to auto-populate title, source, video ID, and thumbnail.
                    </p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter short title"
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-semibold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Description / Subtitle</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter short subtitle card text"
                    rows={2}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                  />
                </div>

                {/* Thumbnail Url */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Card Thumbnail URL</label>
                  <input
                    type="text"
                    value={formThumbnailUrl}
                    onChange={(e) => setFormThumbnailUrl(e.target.value)}
                    placeholder="https://picsum.photos/..."
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>

                {/* Type specific fields */}
                {formType === 'video' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Source</label>
                      <select
                        value={formVideoSource}
                        onChange={(e) => setFormVideoSource(e.target.value as any)}
                        className="block w-full rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Video ID</label>
                      <input
                        type="text"
                        required
                        value={formVideoId}
                        onChange={(e) => setFormVideoId(e.target.value)}
                        placeholder="e.g. qH5HIPl0hRo"
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Duration</label>
                      <input
                        type="text"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        placeholder="e.g. 5:24"
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {formType === 'reading' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Story Content</label>
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setEditorMode('markdown')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
                            editorMode === 'markdown' 
                              ? 'bg-white text-teal-700 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Type size={14} /> Markdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('richtext')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
                            editorMode === 'richtext' 
                              ? 'bg-white text-teal-700 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Edit size={14} /> Rich Text
                        </button>
                      </div>
                    </div>
                    
                    {editorMode === 'markdown' ? (
                      <textarea
                        value={formStoryContent}
                        onChange={(e) => setFormStoryContent(e.target.value)}
                        placeholder="# Markdown Header\n\nWrite story contents...\n\nUse ![Image Description](https://image-url) to insert images."
                        rows={10}
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                      />
                    ) : (
                      <RichTextEditor 
                        content={formStoryContent} 
                        onChange={setFormStoryContent} 
                      />
                    )}
                  </div>
                )}

                {formType === 'writing' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Writing Prompt</label>
                    <textarea
                      value={formWritingPrompt}
                      onChange={(e) => setFormWritingPrompt(e.target.value)}
                      placeholder="e.g. Write a letter to Jesus about what you're thankful for today!"
                      rows={3}
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none font-semibold"
                    />
                  </div>
                )}

                {formType === 'painting' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Coloring Template Outline Image URL</label>
                    <input
                      type="text"
                      value={formColoringImageUrl}
                      onChange={(e) => setFormColoringImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                )}

                {formType === 'document' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Document URL / PDF File Path</label>
                    <input
                      type="text"
                      value={formDocumentUrl}
                      onChange={(e) => setFormDocumentUrl(e.target.value)}
                      placeholder="/curriculum/kids/lesson-1.pdf"
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Status & Scheduling */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="block w-full rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none bg-white"
                    >
                      <option value="draft">Draft (Hidden)</option>
                      <option value="published">Published (Live)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  {formStatus === 'published' && (
                    <div className="space-y-2 col-span-2 grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Publish Date</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formPublishDate}
                          onChange={(e) => setFormPublishDate(e.target.value)}
                          className="block w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Expiry Date</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formUnpublishDate}
                          onChange={(e) => setFormUnpublishDate(e.target.value)}
                          className="block w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 text-white font-bold rounded-full hover:bg-teal-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  <span>Save Content Card</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Preview Modal */}
      {isPreviewOpen && previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-150 px-2.5 py-0.5 rounded-md">
                  Visitor View Preview
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{previewItem.title}</h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {previewItem.type === 'video' && (
                <div className="space-y-3">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-sm">
                    {previewItem.video_source === 'youtube' ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${previewItem.video_id}?modestbranding=1&rel=0`}
                        title={previewItem.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <iframe
                        src={`https://player.vimeo.com/video/${previewItem.video_id}`}
                        title={previewItem.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    )}
                  </div>
                  {previewItem.description && <p className="text-sm font-semibold text-gray-600">{previewItem.description}</p>}
                </div>
              )}

              {previewItem.type === 'reading' && (
                <div className="prose prose-sm max-w-none text-left bg-gray-50 p-6 rounded-2xl border border-gray-200/60 max-h-96 overflow-y-auto">
                  <div className="font-semibold whitespace-pre-wrap leading-relaxed text-sm text-gray-700">
                    {previewItem.story_content || 'No story content.'}
                  </div>
                </div>
              )}

              {previewItem.type === 'writing' && (
                <div className="border-4 border-dashed border-amber-200 p-6 rounded-[2rem] bg-amber-50/20 text-center space-y-4">
                  <h4 className="font-bold text-lg text-amber-700">{previewItem.writing_prompt || 'No prompt.'}</h4>
                  <textarea
                    disabled
                    placeholder="The child would type their letter here..."
                    rows={4}
                    className="w-full rounded-2xl border border-amber-200 px-3 py-2.5 text-sm focus:outline-none bg-white font-medium shadow-sm"
                  />
                  <button disabled className="px-5 py-2.5 bg-amber-400 text-white font-black rounded-2xl shadow-md border-b-4 border-amber-500">
                    Save Letter
                  </button>
                </div>
              )}

              {previewItem.type === 'painting' && (
                <div className="border-4 border-dashed border-amber-200 p-6 rounded-[2rem] bg-amber-50/20 text-center space-y-4">
                  <h4 className="font-bold text-lg text-amber-700">Coloring Sandbox</h4>
                  <div className="aspect-[4/3] w-full rounded-2xl border border-amber-200 bg-white flex items-center justify-center relative overflow-hidden">
                    {previewItem.coloring_image_url ? (
                      <img src={previewItem.coloring_image_url} alt="outline" className="h-full object-contain" />
                    ) : (
                      <span className="text-gray-400 font-semibold text-sm">Line-art outline template placeholder</span>
                    )}
                  </div>
                  <div className="flex justify-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-500"></span>
                    <span className="w-5 h-5 rounded-full bg-blue-500"></span>
                    <span className="w-5 h-5 rounded-full bg-green-500"></span>
                    <span className="w-5 h-5 rounded-full bg-amber-500"></span>
                  </div>
                </div>
              )}

              {previewItem.type === 'document' && (
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{previewItem.title}</p>
                    <p className="text-xs text-gray-500 truncate">{previewItem.document_url || 'No attachment.'}</p>
                  </div>
                  <button disabled className="px-4 py-2 bg-teal-700 text-white font-bold text-xs rounded-xl shadow">
                    Open PDF
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl cursor-pointer text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
