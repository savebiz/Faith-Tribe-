import React, { useState } from 'react';
import { X, Send, Heart, MessageCircle, Users } from 'lucide-react';

interface LiveStreamPlayerProps {
  onClose: () => void;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<{user: string, text: string}[]>([
    { user: "Faith Tribe Admin", text: "Welcome to our live service! God bless you." },
    { user: "Sarah J.", text: "Happy Sunday everyone! 👋" },
    { user: "Mike T.", text: "Ready for the word!" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;
    setMessages([...messages, { user: "You", text: input }]);
    setInput("");
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row text-white animate-in fade-in duration-300">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative">
             <button 
                onClick={onClose}
                className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors text-white"
             >
                <X size={24} />
             </button>
             
             {/* Video Container */}
             <div className="flex-1 bg-black flex items-center justify-center relative">
                 <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold animate-pulse flex items-center">LIVE</span>
                    <span className="bg-black/60 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Users size={12} /> 248 Watching
                    </span>
                 </div>
                 {/* Placeholder for iframe */}
                 <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    {/* Using a generic worship background/video placeholder since we don't have a real live stream */}
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/5_cTtxqzU1c?autoplay=1&mute=0&controls=1" 
                        title="Live Service" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                 </div>
             </div>

             {/* Mobile only info */}
             <div className="p-4 bg-gray-900 md:hidden border-t border-gray-800">
                <h2 className="font-bold text-lg">Sunday Service: Walking in Dominion</h2>
                <p className="text-gray-400 text-sm">RCCG Region 63 Junior Church</p>
             </div>
        </div>

        {/* Sidebar / Chat */}
        <div className="w-full md:w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-[40vh] md:h-full">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shadow-md z-10">
                <div className="flex flex-col">
                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
                        Live Chat
                    </h3>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                {messages.map((msg, idx) => (
                    <div key={idx} className="text-sm animate-in slide-in-from-bottom-2 duration-300">
                        <span className={`font-bold mr-2 ${msg.user === 'You' ? 'text-brand-accent' : 'text-gray-400'}`}>
                            {msg.user}:
                        </span>
                        <span className="text-gray-200">{msg.text}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-primary placeholder-gray-500"
                />
                <button type="submit" className="p-2 bg-brand-primary rounded-full hover:bg-brand-secondary text-white transition-colors">
                    <Send size={16} />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-red-500 transition-colors" onClick={() => setMessages(prev => [...prev, {user: "You", text: "❤️"}])}>
                    <Heart size={16} />
                </button>
            </form>
        </div>
    </div>
  );
};

export default LiveStreamPlayer;