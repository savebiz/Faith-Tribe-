import React, { useState } from 'react';
import { Audience } from '../types';
import { Heart, Menu, X, Home, Radio, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: Audience;
  onChangeView: (view: Audience) => void;
  onWatchLive?: () => void;
  isLive: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, onWatchLive, isLive }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getNavStyle = () => {
    switch (currentView) {
      case Audience.KIDS: 
        return 'bg-amber-400 font-display text-white border-b-4 border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.2)]';
      case Audience.TEENS: 
        return 'glassmorphism-dark text-emerald-400 border-b border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.4)]';
      case Audience.TEACHERS: 
        return 'glassmorphism text-teal-800 border-b border-teal-100 shadow-[0_2px_10px_rgba(15,118,110,0.05)]';
      default: 
        return 'glassmorphism text-indigo-950 shadow-sm';
    }
  };

  const getLogoColors = () => {
    switch (currentView) {
      case Audience.KIDS: return 'bg-white text-amber-500 shadow-sm';
      case Audience.TEENS: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case Audience.TEACHERS: return 'bg-teal-50 text-teal-700 border border-teal-100';
      default: return 'bg-indigo-600 text-white shadow-md shadow-indigo-200';
    }
  };

  const getLinkActiveStyle = (value: Audience) => {
    if (currentView === value) {
      switch (currentView) {
        case Audience.KIDS: 
          return 'bg-white text-amber-600 font-bold rounded-2xl shadow-sm scale-105';
        case Audience.TEENS: 
          return 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
        case Audience.TEACHERS: 
          return 'bg-teal-700 text-white font-bold rounded-lg shadow-sm';
        default: 
          return 'bg-indigo-600 text-white font-semibold rounded-lg shadow-sm shadow-indigo-100';
      }
    }
    
    // Inactive styles
    switch (currentView) {
      case Audience.KIDS: return 'text-white hover:bg-white/20 hover:scale-105 rounded-2xl';
      case Audience.TEENS: return 'text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg';
      case Audience.TEACHERS: return 'text-teal-900 hover:text-teal-700 hover:bg-teal-50 rounded-lg';
      default: return 'text-indigo-900 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg';
    }
  };

  const navLinks = [
    { label: 'Kids Zone', value: Audience.KIDS },
    { label: 'Teens Tribe', value: Audience.TEENS },
    { label: 'Teachers Hub', value: Audience.TEACHERS },
  ];

  return (
    <nav className={`w-full transition-all duration-300 ${getNavStyle()} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Logo & Brand: Dual-brand lockup */}
          <div 
            className="flex items-center cursor-pointer group transition-transform active:scale-95 py-1.5" 
            onClick={() => { onChangeView(Audience.HOME); setIsOpen(false); }}
            aria-label="Navigate to Home"
          >
            <div className="flex items-center">
              {/* DTCE Global logo */}
              <img 
                src="/DTCE_Junior_Church.png" 
                alt="DTCE Global" 
                className="h-7 sm:h-9 object-contain"
              />
              
              {/* Vertical divider */}
              <div className="w-px h-6 sm:h-8 bg-[#372f58]/20 mx-2.5 sm:mx-3" />
              
              {/* Faith Tribe Logo (tree flame) */}
              <img 
                src="/Faith_Tribe_Logo.png" 
                alt="Faith Tribe" 
                className="h-7 sm:h-9 object-contain mr-3"
              />
            </div>
            
            {/* Stacked Wordmark & Subtitle */}
            <div className="flex flex-col justify-center">
              <span className={`font-extrabold text-base sm:text-lg leading-none tracking-tight transition-colors duration-300
                ${currentView === Audience.KIDS ? 'font-display text-white' : 
                  currentView === Audience.TEENS ? 'text-white font-sans' : 'text-[#372f58] font-sans'}`}>
                Faith Tribe
              </span>
              <span className={`text-[8px] sm:text-[9px] font-medium tracking-tight mt-0.5 sm:mt-1 leading-none transition-colors duration-300
                ${currentView === Audience.KIDS ? 'text-white/80' : 
                  currentView === Audience.TEENS ? 'text-gray-400' : 'text-[#372f58]/65'}`}>
                <span className="hidden sm:inline">RCCG </span>Region 63 Junior Church<span className="hidden sm:inline"> Portal</span>
              </span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
             {/* Live Button Desktop */}
             {isLive && (
               <button 
                  onClick={onWatchLive}
                  className="mr-4 flex items-center gap-2 bg-[#EE3135] hover:bg-[#d62529] text-white px-4 py-2 rounded-full text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(238,49,53,0.4)] hover:shadow-[0_0_20px_rgba(238,49,53,0.6)]"
               >
                  <Radio size={14} className="animate-pulse" />
                  <span className="tracking-wide">LIVE NOW</span>
               </button>
             )}

            <div className="flex items-center space-x-2">
              <button
                 onClick={() => onChangeView(Audience.HOME)}
                 className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${getLinkActiveStyle(Audience.HOME)}`}
              >
                Home
              </button>
              {navLinks.map((link) => (
                <button
                  key={link.value}
                  onClick={() => onChangeView(link.value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${getLinkActiveStyle(link.value)}`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer
                ${currentView === Audience.KIDS ? 'text-white hover:bg-white/20' : 
                  currentView === Audience.TEENS ? 'text-emerald-400 hover:bg-emerald-500/10' : 
                  'text-teal-800 hover:bg-teal-50'}`}
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className={`md:hidden pb-4 px-2 pt-2 space-y-1 shadow-inner animate-in slide-in-from-top duration-200
          ${currentView === Audience.KIDS ? 'bg-amber-400 border-t border-amber-500' : 
            currentView === Audience.TEENS ? 'bg-gray-900 border-t border-gray-800' : 
            'bg-white border-t border-teal-50'}`}>
          
          {isLive && (
            <button
                onClick={() => { onWatchLive?.(); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold text-[#EE3135] hover:bg-black/5 flex items-center gap-2 transition-colors cursor-pointer"
            >
                <Radio size={16} className="animate-pulse" />
                <span>Watch Live Stream</span>
            </button>
          )}
          
          <button
              onClick={() => { onChangeView(Audience.HOME); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${getLinkActiveStyle(Audience.HOME)}`}
          >
              Home
          </button>
          
          {navLinks.map((link) => (
            <button
              key={link.value}
              onClick={() => { onChangeView(link.value); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${getLinkActiveStyle(link.value)}`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;