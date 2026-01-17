import React from 'react';
import { ContentItem } from '../types';
import { Play, FileText, Calendar } from 'lucide-react';

interface ContentSectionProps {
  title: string;
  items: ContentItem[];
  colorTheme: string; // e.g., "text-blue-600"
}

const ContentSection: React.FC<ContentSectionProps> = ({ title, items, colorTheme }) => {
  return (
    <div className="py-8">
      <h2 className={`text-2xl font-bold mb-6 ${colorTheme} flex items-center gap-2`}>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                {item.type === 'VIDEO' && <div className="bg-white/90 p-3 rounded-full shadow-lg"><Play size={24} className="text-gray-900 ml-1" /></div>}
              </div>
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {item.type}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-brand-primary transition-colors">{item.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentSection;
