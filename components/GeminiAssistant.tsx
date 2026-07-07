import React, { useState, useRef, useEffect } from 'react';
import { Audience, ChatMessage } from '../types';
import { generateFaithAssistantResponse } from '../services/geminiService';
import { Send, Bot, Loader2, User, Sparkles, Heart, HelpCircle, Share2, Flame, AlertCircle } from 'lucide-react';
import { Christicon } from '@christicons/react';
import { logAnalyticsEvent } from '../lib/supabase';

const PrayingHands = (props: { className?: string }) => {
  const sizeMatch = props.className?.match(/w-(\d+)\s+h-(\d+)/) || props.className?.match(/h-(\d+)\s+w-(\d+)/);
  const sizeValue = sizeMatch ? Number(sizeMatch[1]) * 4 : 24;
  return <Christicon name="praying hands" size={sizeValue} style={{ color: 'currentColor' }} className={props.className} />;
};

interface GeminiAssistantProps {
  audience: Audience;
  onSelectAction?: (actionType: 'get_saved' | 'share_faith' | 'altar_script') => void;
}

const formatText = (text?: string) => {
  if (!text || typeof text !== 'string') return '';
  // Simple escape
  const safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  // Parse bold and italics
  return safeText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ audience, onSelectAction }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat when audience changes
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: getInitialGreeting(audience)
      }
    ]);
  }, [audience]);

  const getInitialGreeting = (aud: Audience) => {
    switch (aud) {
      case Audience.KIDS: 
        return "Hi! I'm Faith Buddy! Do you know how much Jesus loves you?";
      case Audience.TEENS: 
        return "Yo! Tribe Mentor here. Whether you're 100% sure about faith or have big questions, I'm here for it. Let's talk.";
      case Audience.TEACHERS: 
        return "Welcome, Teacher. Ready to win some souls, lead altar calls, and plan some powerful lessons today?";
      default: 
        return "Hello! How can I help you today?";
    }
  };

  const getThemeColors = () => {
    switch (audience) {
      case Audience.KIDS: return 'bg-amber-400 text-white border-b-2 border-amber-500 font-display';
      case Audience.TEENS: return 'bg-gray-800 text-emerald-400 border-b border-gray-700 font-sans';
      case Audience.TEACHERS: return 'bg-teal-700 text-white border-b border-teal-800 font-sans';
      default: return 'bg-brand-primary text-white border-b border-indigo-700 font-sans';
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    logAnalyticsEvent('chat_message_sent', audience.toLowerCase(), { input_length: input.length });

    try {
      const responseText = await generateFaithAssistantResponse(input, audience);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "I'm having a little trouble connecting to the ministry helper service. Let's try again in a moment!", 
        isError: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[550px] w-full max-w-lg mx-auto border transition-all duration-300
      ${audience === Audience.TEENS ? 'bg-gray-900 border-gray-700/60 shadow-emerald-500/5' : 
        audience === Audience.KIDS ? 'bg-white border-amber-100 shadow-amber-500/5' : 
        'bg-white border-gray-100'}`}>
      
      {/* Header */}
      <div className={`p-4.5 ${getThemeColors()} flex items-center justify-between shadow-sm`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
            {audience === Audience.KIDS ? (
              <PrayingHands className="w-6 h-6 text-white" />
            ) : audience === Audience.TEENS ? (
              <Christicon name="star" size={24} style={{ color: 'currentColor' }} />
            ) : (
              <Christicon name="scroll" size={24} style={{ color: 'currentColor' }} />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight">
              {audience === Audience.KIDS ? 'Faith Buddy' : audience === Audience.TEENS ? 'Tribe Mentor' : 'Ministry Co-Pilot'}
            </h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-semibold mt-0.5">Online Helper</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-300
        ${audience === Audience.TEENS ? 'bg-gray-950/40' : 'bg-gray-50/50'}`}>
        
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
              <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                  ${isUser 
                    ? 'bg-indigo-600 text-white' 
                    : audience === Audience.KIDS 
                      ? 'bg-amber-400 text-white font-display' 
                      : audience === Audience.TEENS 
                        ? 'bg-gray-800 text-emerald-400 border border-gray-700' 
                        : 'bg-teal-700 text-white'}`}>
                  {isUser ? (
                    <User size={14} />
                  ) : audience === Audience.KIDS ? (
                    <div className="faith-buddy-avatar flex items-center justify-center">
                      <PrayingHands className="w-5 h-5 text-white" />
                    </div>
                  ) : audience === Audience.TEENS ? (
                    <Christicon name="star" size={14} style={{ color: 'currentColor' }} />
                  ) : (
                    <Christicon name="scroll" size={14} style={{ color: 'currentColor' }} />
                  )}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none flex items-start gap-1.5'
                      : audience === Audience.TEENS
                        ? 'bg-gray-800 text-gray-100 border border-gray-700/60 rounded-tl-none'
                        : 'bg-white text-gray-800 border border-gray-150 rounded-tl-none'}`}>
                  {msg.isError && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  <div className="space-y-1.5">
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} dangerouslySetInnerHTML={{ __html: formatText(line) }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                   <Loader2 size={14} className="animate-spin text-indigo-500" />
                </div>
                <div className={`p-3.5 rounded-2xl rounded-tl-none shadow-sm border
                  ${audience === Audience.TEENS ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-150 text-gray-500'}`}>
                    <span className="text-xs font-semibold tracking-wider">Typing...</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Quick Prompts - Soul Winning Focus (Cleaned from emojis) */}
      <div className={`px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-b
        ${audience === Audience.TEENS ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
        
        {audience === Audience.KIDS && (
          <button 
            onClick={() => handleQuickPrompt("Who is Jesus?")} 
            className="whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-full text-xs font-bold hover:bg-amber-50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <HelpCircle size={12} className="text-amber-500" />
            <span>Who is Jesus?</span>
          </button>
        )}
        
        {audience === Audience.TEENS && (
          <>
            <button 
              onClick={() => onSelectAction ? onSelectAction('get_saved') : handleQuickPrompt("How do I get saved?")} 
              className="whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-800 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-bold hover:bg-emerald-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Heart size={12} className="text-emerald-400 fill-emerald-400/20" />
              <span>I want to get saved</span>
            </button>
            <button 
              onClick={() => onSelectAction ? onSelectAction('share_faith') : handleQuickPrompt("How do I tell my friends about God?")} 
              className="whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-800 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-bold hover:bg-emerald-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Share2 size={12} className="text-emerald-400" />
              <span>Sharing Faith</span>
            </button>
          </>
        )}
        
        {audience === Audience.TEACHERS && (
          <button 
            onClick={() => onSelectAction ? onSelectAction('altar_script') : handleQuickPrompt("Create an altar call script")} 
            className="whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-teal-300 text-teal-800 rounded-full text-xs font-bold hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Flame size={12} className="text-teal-600 fill-teal-600/10" />
            <span>Altar Call Script</span>
          </button>
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className={`p-4 border-t flex items-center gap-2 ${audience === Audience.TEENS ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={audience === Audience.KIDS ? "Ask Faith Buddy..." : "Type your message..."}
            className={`w-full px-5 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-colors
              ${audience === Audience.TEENS ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 font-medium'}`}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className={`h-[46px] w-[46px] rounded-full text-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center shrink-0 cursor-pointer
            ${audience === Audience.KIDS ? 'bg-amber-400 hover:bg-amber-500 shadow-amber-300/40' : 
              audience === Audience.TEENS ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-400/40' : 
              'bg-teal-700 hover:bg-teal-800 shadow-teal-700/40'}`}
        >
          <Send size={18} className="-ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default GeminiAssistant;