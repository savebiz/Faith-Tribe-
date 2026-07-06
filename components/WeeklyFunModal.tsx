import React, { useState, useEffect, useRef } from 'react';
import { Play, BookOpen, Sparkles, Award, X, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { WeeklyFunItem } from '../lib/weeklyFunConfig';
import { logAnalyticsEvent } from '../lib/supabase';

interface WeeklyFunModalProps {
  item: WeeklyFunItem | null;
  onClose: () => void;
}

// Removed renderSimpleMarkdown in favor of marked + DOMPurify

// In-App Writing Activity Component
const KidsWritingActivity: React.FC<{ item: WeeklyFunItem }> = ({ item }) => {
  const storageKey = `kids_writing_${item.id}`;
  const [text, setText] = useState(() => localStorage.getItem(storageKey) || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(storageKey, text);
    setIsSaved(true);
    toast.success('Your writing has been saved! 🌟 Great job!', { duration: 4000 });
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
      <div className="bg-amber-100/50 border border-amber-250 p-4 rounded-2xl">
        <h4 className="font-bold text-amber-800 text-sm mb-1 uppercase tracking-wider">Activity Prompt:</h4>
        <p className="text-sm sm:text-base text-gray-700 font-medium">{item.writingPrompt}</p>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          localStorage.setItem(storageKey, e.target.value);
        }}
        placeholder="Start typing your letter or response here..."
        className="w-full h-40 p-4 border-2 border-amber-200 rounded-2xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-150 text-sm sm:text-base text-gray-800 bg-white shadow-inner"
      />

      <div className="flex justify-between items-center pt-1">
        <span className="text-[10px] sm:text-xs text-amber-600 font-bold italic">
          * Saved automatically as you type
        </span>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-2xl transition-all shadow-md shadow-amber-200 cursor-pointer text-xs sm:text-sm flex items-center gap-1 border-b-4 border-amber-600 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaved ? <CheckCircle2 size={14} /> : <Check size={14} />}
          <span>{isSaved ? 'Saved!' : 'Save Letter'}</span>
        </button>
      </div>
    </div>
  );
};

// In-App Canvas Painting Activity Component
const KidsColoringActivity: React.FC<{ item: WeeklyFunItem }> = ({ item }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1CABB9'); // Default Brand Teal
  const [brushSize, setBrushSize] = useState(8);
  const lastX = useRef(0);
  const lastY = useRef(0);

  const colors = [
    '#EE3135', // Brand Red
    '#F8B229', // Brand Gold
    '#1CABB9', // Brand Teal
    '#372f58', // Deep Indigo
    '#EC4899', // Pink
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#000000', // Black
    '#FFFFFF'  // White
  ];

  const drawTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Fill canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw outline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw cross outline in center
    ctx.strokeRect(175, 40, 50, 220);
    ctx.strokeRect(110, 90, 180, 50);
    ctx.stroke();

    // Draw heart outline inside the cross intersection
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(200, 130);
    ctx.bezierCurveTo(200, 127, 195, 115, 185, 115);
    ctx.bezierCurveTo(170, 115, 170, 135, 170, 135);
    ctx.bezierCurveTo(170, 150, 185, 162, 200, 175);
    ctx.bezierCurveTo(215, 162, 230, 150, 230, 135);
    ctx.bezierCurveTo(230, 135, 230, 115, 215, 115);
    ctx.bezierCurveTo(205, 115, 200, 127, 200, 130);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawTemplate(ctx, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e: any) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    lastX.current = x;
    lastY.current = y;
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault(); // Prevents scroll on mobile drag
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastX.current, lastY.current);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        lastX.current = x;
        lastY.current = y;
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawTemplate(ctx, canvas.width, canvas.height);
      }
    }
  };

  const saveArtwork = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'my-faith-artwork.png';
      link.href = dataUrl;
      link.click();
      toast.success('Artwork saved to Downloads folder! 🎨 Great coloring!', { duration: 4000 });
    }
  };

  return (
    <div className="space-y-4 text-center font-sans animate-in fade-in duration-200">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-200">
        {/* Colors selector list */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#372f58' : c === '#FFFFFF' ? '#cbd5e1' : 'transparent'
              }}
              aria-label={`Color ${c}`}
            >
              {color === c && (
                <span className={`w-1.5 h-1.5 rounded-full ${c === '#FFFFFF' ? 'bg-gray-800' : 'bg-white'}`}></span>
              )}
            </button>
          ))}
        </div>

        {/* Brush Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Brush:</span>
          <input
            type="range"
            min="2"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 sm:w-24 accent-amber-400 h-1 bg-amber-100 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-700 font-bold w-6 text-left">{brushSize}px</span>
        </div>
      </div>

      {/* Canvas Box */}
      <div className="flex justify-center bg-gray-50 border-2 border-amber-100/60 rounded-3xl p-3 shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-white rounded-2xl border border-gray-200 shadow-md max-w-full touch-none cursor-crosshair"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2.5 pt-1">
        <button
          onClick={clearCanvas}
          className="px-4.5 py-2.5 bg-gray-150/70 hover:bg-gray-200 text-gray-650 text-xs font-bold rounded-2xl transition-all cursor-pointer hover:scale-102 active:scale-98 border border-gray-200"
        >
          Clear Canvas
        </button>
        <button
          onClick={saveArtwork}
          className="px-5 py-2.5 bg-[#1CABB9] hover:bg-[#158f9c] text-white font-black rounded-2xl transition-all shadow-md shadow-teal-200 cursor-pointer text-xs sm:text-sm border-b-4 border-teal-700 hover:scale-[1.02] active:scale-[0.98]"
        >
          Download Painting
        </button>
      </div>
    </div>
  );
};

export function WeeklyFunModal({ item, onClose }: WeeklyFunModalProps) {
  useEffect(() => {
    if (item) {
      logAnalyticsEvent('content_viewed', item.zone || null, { item_id: item.id, item_title: item.title, item_type: item.type });
    }
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all w-full max-w-2xl border-4 border-amber-300 max-h-[90vh] flex flex-col font-sans">
        
        {/* Modal Header */}
        <div className="bg-amber-400 px-6 py-4 flex justify-between items-center text-white border-b-4 border-amber-500 shrink-0">
          <h3 className="text-base sm:text-lg font-black font-display tracking-wide flex items-center gap-2">
            {item.type === 'video' && <Play size={18} fill="currentColor" />}
            {item.type === 'reading' && <BookOpen size={18} />}
            {item.type === 'writing' && <Sparkles size={18} />}
            {item.type === 'painting' && <Award size={18} />}
            <span>{item.title}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Close activity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-amber-50/15 text-gray-800">
          {item.type === 'video' && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-amber-100 bg-black shadow-inner">
                <iframe
                  src={`https://www.youtube.com/embed/${item.youtubeVideoId}?modestbranding=1&rel=0&autoplay=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={item.title}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-sans text-left">
                {item.description}
              </p>
            </div>
          )}

                    {item.type === 'reading' && item.storyContent && (
                      <div 
                        className="prose prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:text-amber-700 prose-h2:text-2xl prose-h2:font-black prose-h3:text-xl prose-h3:font-bold prose-h4:text-lg prose-h4:text-gray-800 prose-p:text-gray-650 prose-p:leading-relaxed prose-strong:text-amber-800 prose-strong:font-extrabold prose-hr:border-amber-100 prose-ul:text-gray-600 prose-ol:text-gray-600 prose-img:rounded-lg prose-img:shadow-sm"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            // If it contains HTML tags, assume it's Rich Text. Otherwise, parse as Markdown.
                            /<[a-z][\s\S]*>/i.test(item.storyContent) 
                              ? item.storyContent 
                              : marked.parse(item.storyContent) as string
                          )
                        }}
                      />
                    )}

          {item.type === 'writing' && (
            <KidsWritingActivity item={item} />
          )}

          {item.type === 'painting' && (
            <KidsColoringActivity item={item} />
          )}
        </div>

      </div>
    </div>
  );
}
