import React, { useEffect } from 'react';
import { Play, BookOpen, X } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { ContentItem } from '../types';
import { logAnalyticsEvent } from '../lib/supabase';

interface TeensContentModalProps {
  item: ContentItem | null;
  onClose: () => void;
}

export const TeensContentModal: React.FC<TeensContentModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    if (item) {
      logAnalyticsEvent('teens', 'content.view', item.id, { title: item.title, type: item.type });
    }
  }, [item]);

  if (!item) return null;

  // Render markdown or rich HTML safely
  const renderArticleContent = (content: string) => {
    try {
      // If it looks like HTML, sanitize and return
      if (content.trim().startsWith('<')) {
        return { __html: DOMPurify.sanitize(content) };
      }
      // Otherwise, parse as markdown
      const parsed = marked.parse(content) as string;
      return { __html: DOMPurify.sanitize(parsed) };
    } catch (e) {
      console.error('Failed to parse article content:', e);
      return { __html: DOMPurify.sanitize(content) };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900/60 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${
              item.type === 'VIDEO' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {item.type === 'VIDEO' ? <Play size={16} fill="currentColor" /> : <BookOpen size={16} />}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {item.type === 'VIDEO' ? 'Teens Video Drop' : 'Teens Article Drop'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-300">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            {item.title}
          </h2>
          {item.description && (
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Video Player */}
          {item.type === 'VIDEO' && item.youtubeVideoId && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-inner">
              <iframe
                src={`https://www.youtube.com/embed/${item.youtubeVideoId}?modestbranding=1&rel=0&autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={item.title}
              />
            </div>
          )}

          {/* Article Viewer */}
          {item.type === 'ARTICLE' && (
            <div className="prose prose-invert prose-emerald max-w-none text-left leading-relaxed">
              {item.articleContent ? (
                <div dangerouslySetInnerHTML={renderArticleContent(item.articleContent)} />
              ) : (
                <p className="text-gray-500 italic text-center py-10">No article content has been written for this post yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
