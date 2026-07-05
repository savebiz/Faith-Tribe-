import React, { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { parseScriptureReference } from '../lib/bible/bookCodes';

export interface StudyNoteProps {
  contentHtml: string;
  currentVersionId?: number;
  onNavigateToPassage?: (book: string, chapter: string, versionId?: number) => void;
  showAttribution?: boolean;
}

// Convert ref.ly URL to internal Bible reader route
export function convertRefLyUrl(url: string, currentVersionId?: number): { href: string; isInternal: boolean } {
  if (!url || !url.startsWith('https://ref.ly/')) {
    return { href: url, isInternal: false };
  }

  try {
    const refPath = decodeURIComponent(url.substring('https://ref.ly/'.length));
    
    // Match book, chapter, and optional starting verse
    // Examples: "Gen1:1", "1John4:9-1John4:10", "Ps33:6", "Prov8:22-Prov8:31"
    const match = refPath.match(/^([1-3]?\s*[A-Za-z\s]+)(\d+)(?::(\d+))?/);
    if (match) {
      const rawBook = match[1].trim();
      const chapter = match[2];
      const verse = match[3] || null;

      const parsed = parseScriptureReference(`${rawBook} ${chapter}${verse ? ':' + verse : ''}`);
      if (parsed) {
        const versionQuery = currentVersionId ? `?version=${currentVersionId}` : '';
        return {
          href: `/bible/${parsed.bookCode}/${parsed.chapter}${versionQuery}`,
          isInternal: true
        };
      }
    }
  } catch (e) {
    console.error('Error parsing ref.ly URL:', e);
  }

  return { href: url, isInternal: false };
}

export function StudyNote({
  contentHtml,
  currentVersionId,
  onNavigateToPassage,
  showAttribution = true
}: StudyNoteProps) {
  
  // Sanitize and re-route links on render
  const processedHtml = useMemo(() => {
    if (!contentHtml) return '';

    // Step 1: Clean HTML via DOMPurify
    const clean = DOMPurify.sanitize(contentHtml);

    // Step 2: Use DOMParser to process links
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, 'text/html');
      const anchors = doc.querySelectorAll('a');

      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        if (href) {
          const { href: newHref, isInternal } = convertRefLyUrl(href, currentVersionId);
          a.setAttribute('href', newHref);
          
          if (isInternal) {
            a.setAttribute('data-internal-passage', 'true');
            a.removeAttribute('target');
            a.removeAttribute('rel');
            // Style internal links to match our branding
            a.className = 'text-teal-600 hover:text-teal-850 hover:underline font-bold transition-colors cursor-pointer';
          } else {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            a.className = 'text-indigo-600 hover:text-indigo-850 hover:underline font-bold transition-colors';
          }
        }
      });

      return doc.body.innerHTML;
    } catch (e) {
      console.warn('DOMParser not available, falling back to raw sanitized HTML:', e);
      return clean;
    }
  }, [contentHtml, currentVersionId]);

  // Handle click interception to prevent page reload on internal links
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor) {
      const isInternal = anchor.getAttribute('data-internal-passage') === 'true';
      const href = anchor.getAttribute('href');
      
      if (isInternal && href) {
        e.preventDefault();
        
        // Parse the link target book and chapter
        const match = href.match(/\/bible\/([A-Za-z0-9]+)\/([0-9]+)/);
        if (match) {
          const book = match[1].toUpperCase();
          const chapter = match[2];
          
          if (onNavigateToPassage) {
            onNavigateToPassage(book, chapter, currentVersionId);
          } else {
            // Push history and dispatch event to alert components of navigation
            window.history.pushState(null, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      }
    }
  };

  return (
    <div className="study-note-container space-y-3 font-sans">
      <div 
        onClick={handleContainerClick}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        className="prose prose-sm text-gray-700 leading-relaxed font-sans max-w-none text-left
          prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 
          prose-li:my-1 prose-p:my-2
          prose-strong:text-[#372f58] prose-em:text-gray-800"
      />
      {showAttribution && (
        <div className="text-[10px] text-gray-400 italic pt-1 border-t border-gray-100/60 select-none text-left">
          Tyndale Open Study Notes &copy; 2019 Tyndale House Publishers. Used under CC BY-SA 4.0.
        </div>
      )}
    </div>
  );
}
