import React from 'react';
import { ContentItem } from '../types';
import { Play, FileText, BookOpen, Sparkles, Award } from 'lucide-react';

interface ContentSectionProps {
  title: string;
  items: ContentItem[];
  colorTheme: string; // e.g., "text-brand-accent", "text-teens-primary", "text-teachers-secondary"
  onItemClick?: (item: ContentItem) => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({ title, items, colorTheme, onItemClick }) => {
  
  // Helper to resolve card tag icon and style
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return {
          icon: <Play size={12} fill="currentColor" />,
          label: 'Watch Video',
          badgeClass: 'bg-red-500/10 text-red-500 border border-red-500/20'
        };
      case 'ARTICLE':
        return {
          icon: <BookOpen size={12} />,
          label: 'Read Article',
          badgeClass: 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
        };
      case 'ACTIVITY':
        return {
          icon: <Sparkles size={12} />,
          label: 'Activity',
          badgeClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
        };
      case 'LESSON_PLAN':
        return {
          icon: <FileText size={12} />,
          label: 'Lesson Plan',
          badgeClass: 'bg-teal-500/10 text-teal-600 border border-teal-500/20'
        };
      default:
        return {
          icon: <Award size={12} />,
          label: 'Resource',
          badgeClass: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
        };
    }
  };

  const isTeensTheme = colorTheme.includes('teens');
  const isKidsTheme = colorTheme.includes('accent');

  const getCardStyle = () => {
    if (isTeensTheme) {
      return 'bg-gray-800/80 border border-gray-700/60 hover-lift-teens text-white';
    } else if (isKidsTheme) {
      return 'bg-white border-2 border-amber-100 hover-bounce shadow-sm text-gray-900 rounded-3xl';
    } else {
      return 'bg-white border border-gray-100 hover-lift shadow-sm text-gray-900';
    }
  };

  return (
    <div className="py-6">
      <h2 className={`text-2xl font-black mb-6 tracking-tight ${colorTheme} flex items-center gap-2
        ${isKidsTheme ? 'font-display' : 'font-sans'}`}>
        <span className="w-1.5 h-6 rounded-full bg-current opacity-70"></span>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const meta = getTypeMeta(item.type);
          return (
            <div 
              key={item.id} 
              onClick={() => onItemClick && onItemClick(item)}
              className={`group overflow-hidden cursor-pointer transition-all duration-300 rounded-2xl ${getCardStyle()}`}
            >
              {/* Media Thumbnail */}
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy"
                />
                
                {/* Play Button or Visual Overlay */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  {item.type === 'VIDEO' && (
                    <div className="bg-white text-gray-900 p-3.5 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Duration/Type Overlay badge */}
                <span className={`absolute bottom-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md bg-black/60 text-white`}>
                  {item.duration || item.type}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                    {meta.icon}
                    <span>{meta.label}</span>
                  </span>
                </div>
                <h3 className={`font-bold text-base mb-1.5 line-clamp-2 transition-colors duration-200
                  ${isTeensTheme ? 'group-hover:text-emerald-300 text-gray-100' : 'group-hover:text-indigo-600 text-gray-900'}
                  ${isKidsTheme ? 'font-display text-lg' : 'font-sans'}`}>
                  {item.title}
                </h3>
                <p className={`text-sm line-clamp-2 leading-relaxed ${isTeensTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentSection;
