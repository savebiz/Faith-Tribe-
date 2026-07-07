import React, { useEffect } from 'react';
import { Play, BookOpen, X, Volume2, Music } from 'lucide-react';
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

  const renderVideoPlayer = (urlOrId: string, title: string) => {
    const cleanUrl = urlOrId.trim();
    
    // 1. Check if it's a YouTube URL or YouTube ID
    const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const youtubeMatch = cleanUrl.match(youtubeRegExp);
    
    if (youtubeMatch && youtubeMatch[2].length === 11) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[2]}?modestbranding=1&rel=0&autoplay=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title}
        />
      );
    } else if (cleanUrl.length === 11 && !cleanUrl.includes('/') && !cleanUrl.includes('.')) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${cleanUrl}?modestbranding=1&rel=0&autoplay=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title}
        />
      );
    }

    // 2. Check if it's a Vimeo URL
    const vimeoRegExp = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = cleanUrl.match(vimeoRegExp);
    if (vimeoMatch) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
        />
      );
    }

    // 3. Check if it's a direct video link
    const isDirectVideo = cleanUrl.toLowerCase().endsWith('.mp4') || 
                          cleanUrl.toLowerCase().endsWith('.webm') || 
                          cleanUrl.toLowerCase().endsWith('.ogg') ||
                          cleanUrl.toLowerCase().endsWith('.mov') ||
                          cleanUrl.includes('storage.googleapis.com') ||
                          cleanUrl.includes('supabase.co/storage');
    
    if (isDirectVideo) {
      return (
        <video 
          src={cleanUrl} 
          controls 
          autoPlay 
          className="w-full h-full object-contain bg-black rounded-2xl" 
        />
      );
    }

    // 4. Fallback: treat it as a direct embed URL
    return (
      <iframe
        src={cleanUrl}
        className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={title}
      />
    );
  };

  const getYouTubeId = (urlOrId: string) => {
    const cleanUrl = urlOrId.trim();
    const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const youtubeMatch = cleanUrl.match(youtubeRegExp);
    if (youtubeMatch && youtubeMatch[2].length === 11) {
      return youtubeMatch[2];
    }
    return cleanUrl;
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
              item.type === 'VIDEO' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
              item.type === 'AUDIO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {item.type === 'VIDEO' ? <Play size={16} fill="currentColor" /> : 
               item.type === 'AUDIO' ? <Volume2 size={16} /> :
               <BookOpen size={16} />}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {item.type === 'VIDEO' ? 'Teens Video Drop' : 
               item.type === 'AUDIO' ? 'Teens Audio Message' : 
               item.type === 'DOCUMENT' ? 'Teens Guide Drop' :
               'Teens Article Drop'}
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
              {renderVideoPlayer(item.youtubeVideoId, item.title)}
            </div>
          )}

          {/* Audio Player Templates */}
          {item.type === 'AUDIO' && item.youtubeVideoId && (
            <div className="space-y-4">
              {/* Direct File Link Player */}
              {(!item.videoSource || item.videoSource === 'direct') && (
                <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center space-y-4 shadow-inner">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Music size={28} className="text-amber-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white">Listen to Message</p>
                    {item.duration && <p className="text-xs text-gray-500 mt-0.5">Duration: {item.duration}</p>}
                  </div>
                  <audio controls className="w-full max-w-md mt-2 outline-none" src={item.youtubeVideoId} />
                </div>
              )}

              {/* Spotify Embed Player */}
              {item.videoSource === 'spotify' && (
                <div className="w-full overflow-hidden rounded-2xl border border-gray-800 shadow-inner bg-black">
                  <iframe 
                    src={item.youtubeVideoId.includes('embed') ? item.youtubeVideoId : `https://open.spotify.com/embed/track/${item.youtubeVideoId.split('/').pop()?.split('?')[0]}`}
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allowFullScreen 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  />
                </div>
              )}

              {/* SoundCloud Embed Player */}
              {item.videoSource === 'soundcloud' && (
                <div className="w-full overflow-hidden rounded-2xl border border-gray-800 shadow-inner">
                  <iframe 
                    width="100%" 
                    height="166" 
                    scrolling="no" 
                    frameBorder="no" 
                    allow="autoplay" 
                    src={item.youtubeVideoId.includes('api.soundcloud.com') ? item.youtubeVideoId : `https://w.soundcloud.com/player/?url=${encodeURIComponent(item.youtubeVideoId)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                  />
                </div>
              )}

              {/* YouTube Link (Embedded Player) */}
              {item.videoSource === 'youtube' && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-inner">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(item.youtubeVideoId)}?modestbranding=1&rel=0`}
                    className="w-full h-full"
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={item.title}
                  />
                </div>
              )}
            </div>
          )}

          {/* Article / Document Viewer */}
          {(item.type === 'ARTICLE' || item.type === 'DOCUMENT') && (
            <div className="space-y-6">
              <div className="prose prose-invert prose-emerald max-w-none text-left leading-relaxed">
                {item.articleContent ? (
                  <div dangerouslySetInnerHTML={renderArticleContent(item.articleContent)} />
                ) : (
                  <p className="text-gray-500 italic text-center py-10">No article content has been written for this post yet.</p>
                )}
              </div>

              {item.type === 'DOCUMENT' && item.documentUrl && (
                <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-950 p-5 rounded-2xl border border-gray-805/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white">Guide / Attachment PDF</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Access the full document guide reference</p>
                    </div>
                  </div>
                  <a 
                    href={item.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md text-center inline-flex items-center justify-center gap-1.5 cursor-pointer decoration-none"
                  >
                    <span>Open Document Link</span>
                    &rarr;
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
