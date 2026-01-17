import React from 'react';
import { Audience } from '../types';
import { Heart, Menu, X, Home, Radio } from 'lucide-react';

interface NavbarProps {
  currentView: Audience;
  onChangeView: (view: Audience) => void;
  onWatchLive?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, onWatchLive }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const getNavStyle = () => {
    switch (currentView) {
      case Audience.KIDS: return 'bg-brand-accent text-white';
      case Audience.TEENS: return 'bg-gray-900 text-teens-primary border-b border-gray-800';
      case Audience.TEACHERS: return 'bg-white text-teachers-secondary border-b border-gray-200';
      default: return 'bg-white/90 backdrop-blur-md text-brand-primary sticky top-0 z-50';
    }
  };

  const navLinks = [
    { label: 'Kids Zone', value: Audience.KIDS },
    { label: 'Teens Tribe', value: Audience.TEENS },
    { label: 'Teachers Hub', value: Audience.TEACHERS },
  ];

  return (
    <nav className={`w-full transition-colors duration-300 ${getNavStyle()} sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onChangeView(Audience.HOME)}>
            <div className={`p-2 rounded-full mr-2 ${currentView === Audience.KIDS ? 'bg-white text-brand-accent' : 'bg-brand-primary text-white'}`}>
              <Heart size={20} fill="currentColor" />
            </div>
            <span className={`font-bold text-xl tracking-tight ${currentView === Audience.KIDS ? 'font-display' : 'font-sans'}`}>
              Faith Tribe
            </span>
          </div>
          
          <div className="hidden md:flex items-center">
             {/* Live Button Desktop */}
             <button 
                onClick={onWatchLive}
                className="mr-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md animate-pulse"
             >
                <Radio size={14} /> LIVE NOW
             </button>

            <div className="flex items-baseline space-x-4">
              <button
                 onClick={() => onChangeView(Audience.HOME)}
                 className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-opacity-20 hover:bg-black`}
              >
                Home
              </button>
              {navLinks.map((link) => (
                <button
                  key={link.value}
                  onClick={() => onChangeView(link.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 
                    ${currentView === link.value 
                      ? 'bg-opacity-20 bg-black font-bold ring-1 ring-opacity-10 ring-black' 
                      : 'hover:bg-opacity-10 hover:bg-black'}`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-opacity-20 hover:bg-black focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden pb-4">
          <div className="px-2 pt-2 space-y-1 sm:px-3">
             <button
                onClick={() => { onWatchLive?.(); setIsOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-bold text-red-500 hover:bg-opacity-10 hover:bg-black flex items-center gap-2"
            >
                <Radio size={16} /> Watch Live Stream
            </button>
            <button
                onClick={() => { onChangeView(Audience.HOME); setIsOpen(false); }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-opacity-10 hover:bg-black"
            >
                Home
            </button>
            {navLinks.map((link) => (
              <button
                key={link.value}
                onClick={() => { onChangeView(link.value); setIsOpen(false); }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-opacity-10 hover:bg-black"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;