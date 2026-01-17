import React, { useState, useRef, useEffect } from 'react';
import { Audience, ChatMessage } from '../types';
import { generateFaithAssistantResponse } from '../services/geminiService';
import { Send, Bot, Loader2, User, Sparkles, Heart } from 'lucide-react';

interface GeminiAssistantProps {
  audience: Audience;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ audience }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      case Audience.KIDS: return "Hi! I'm Faith Buddy! 🦁 Do you know how much Jesus loves you?";
      case Audience.TEENS: return "Yo! Tribe Mentor here. Whether you're 100% sure about faith or have big questions, I'm here for it.";
      case Audience.TEACHERS: return "Welcome, Teacher. Ready to win some souls and plan some lessons today?";
      default: return "Hello! How can I help you today?";
    }
  };

  const getThemeColors = () => {
    switch (audience) {
      case Audience.KIDS: return 'bg-brand-accent text-white';
      case Audience.TEENS: return 'bg-teens-secondary text-white';
      case Audience.TEACHERS: return 'bg-teachers-primary text-white';
      default: return 'bg-brand-primary text-white';
    }
  };

  const handleQuickPrompt = (prompt: string) => {
      setInput(prompt);
      // Optional: auto-submit? For now let user confirm.
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateFaithAssistantResponse(input, audience);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "Sorry, I can't connect right now.", isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[600px] w-full max-w-lg mx-auto">
      {/* Header */}
      <div className={`p-4 ${getThemeColors()} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 p-2 rounded-full">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {audience === Audience.KIDS ? 'Faith Buddy' : audience === Audience.TEENS ? 'Tribe Mentor' : 'Co-Pilot'}
            </h3>
            <p className="text-xs opacity-90">Powered by Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${msg.role === 'user' ? 'bg-gray-300' : audience === Audience.KIDS ? 'bg-yellow-400' : audience === Audience.TEENS ? 'bg-purple-600' : 'bg-teal-700'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} className="text-white" />}
              </div>

              <div className={`p-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'}`}>
                {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-end gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-200`}>
                   <Loader2 size={16} className="animate-spin text-gray-500" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-200">
                    <span className="text-xs text-gray-400">Thinking...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts - Soul Winning Focus */}
      <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
           {audience === Audience.KIDS && (
               <button onClick={() => handleQuickPrompt("Who is Jesus?")} className="whitespace-nowrap px-3 py-1 bg-white border border-yellow-300 text-yellow-600 rounded-full text-xs font-medium hover:bg-yellow-50">
                  🦁 Who is Jesus?
               </button>
           )}
           {audience === Audience.TEENS && (
               <>
                <button onClick={() => handleQuickPrompt("How do I get saved?")} className="whitespace-nowrap px-3 py-1 bg-white border border-purple-300 text-purple-600 rounded-full text-xs font-medium hover:bg-purple-50">
                    🙏 I want to get saved
                </button>
                <button onClick={() => handleQuickPrompt("How do I tell my friends about God?")} className="whitespace-nowrap px-3 py-1 bg-white border border-purple-300 text-purple-600 rounded-full text-xs font-medium hover:bg-purple-50">
                    🗣️ Sharing Faith
                </button>
               </>
           )}
           {audience === Audience.TEACHERS && (
               <button onClick={() => handleQuickPrompt("Create an altar call script")} className="whitespace-nowrap px-3 py-1 bg-white border border-teal-300 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-50">
                   🔥 Altar Call Script
               </button>
           )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={audience === Audience.KIDS ? "Ask Faith Buddy..." : "Type your message..."}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-full text-white transition-colors disabled:opacity-50
              ${audience === Audience.KIDS ? 'bg-brand-accent hover:bg-amber-600' : 
                audience === Audience.TEENS ? 'bg-teens-secondary hover:bg-violet-700' : 
                'bg-teachers-primary hover:bg-teal-800'}`}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeminiAssistant;