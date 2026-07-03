import React from 'react';
import { X, Check } from 'lucide-react';

export interface ReaderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isKidsMode: boolean;
  setIsKidsMode: (val: boolean) => void;
  fontSize: number;
  setFontSize: (val: number) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
  lineHeight: number;
  setLineHeight: (val: number) => void;
  effectiveFontSize: number;
  effectiveFontFamily: string;
  effectiveLineHeight: number;
}

const DEFAULT_FONTS = [
  { name: 'Inter', category: 'Sans-Serif' },
  { name: 'Roboto', category: 'Sans-Serif' },
  { name: 'Verdana', category: 'Sans-Serif' },
  { name: 'Source Serif 4', category: 'Serif' },
  { name: 'Georgia', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
];

const KIDS_FONTS = [
  { name: 'Lexend', category: 'Sans-Serif' },
  { name: 'Quicksand', category: 'Sans-Serif' },
  { name: 'Open Sans', category: 'Sans-Serif' },
];

export function ReaderSettings({
  isOpen,
  onClose,
  isKidsMode,
  setIsKidsMode,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
  effectiveFontSize,
  effectiveFontFamily,
  effectiveLineHeight,
}: ReaderSettingsProps) {
  if (!isOpen) return null;

  const currentFonts = isKidsMode ? KIDS_FONTS : DEFAULT_FONTS;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 bg-gray-900/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300">
      {/* Background overlay click handler */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Settings Bottom Sheet Card */}
      <div 
        className={`relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 transition-all ${
          isKidsMode ? 'pb-8 pt-6' : 'pb-6 pt-5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
          <h3 className={`font-black text-[#372f58] ${isKidsMode ? 'text-xl' : 'text-base'}`}>
            Reader Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Controls Container */}
        <div className="px-6 py-4 space-y-6">
          {/* Task 1: Kids Mode Toggle (iOS-style pill toggle) */}
          <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div>
              <span className={`block font-black text-[#372f58] ${isKidsMode ? 'text-base' : 'text-sm'}`}>
                Kids Mode 🧸
              </span>
              <span className="block text-[10px] font-semibold text-gray-400 mt-0.5">
                Adapts styling, sizing, and typography for child legibility
              </span>
            </div>

            {/* iOS Pill Switch */}
            <button
              onClick={() => setIsKidsMode(!isKidsMode)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                isKidsMode ? 'bg-[#1CABB9]' : 'bg-gray-200'
              }`}
              aria-label="Toggle Kids Mode"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                  isKidsMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Task 3.1: Font Size Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#372f58]/80 uppercase tracking-wider">
                Font Size
              </span>
              {isKidsMode && (
                <span className="text-[10px] font-black text-[#1CABB9] bg-[#1CABB9]/10 px-2 py-0.5 rounded-full">
                  Min 20px Enforced
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-150 rounded-2xl p-2">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="flex-1 flex items-center justify-center py-2 hover:bg-white text-gray-500 hover:text-[#1CABB9] rounded-xl transition-all cursor-pointer"
                title="Decrease Font Size"
              >
                <span className="text-xs font-black">A</span>
              </button>
              <div className="text-sm font-black text-[#372f58] px-2 min-w-[48px] text-center">
                {effectiveFontSize}px
              </div>
              <button
                onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                className="flex-1 flex items-center justify-center py-2 hover:bg-white text-gray-500 hover:text-[#1CABB9] rounded-xl transition-all cursor-pointer"
                title="Increase Font Size"
              >
                <span className="text-base font-black">A</span>
              </button>
            </div>
          </div>

          {/* Task 3.2: Line Spacing (Line Height) Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#372f58]/80 uppercase tracking-wider flex items-center gap-1.5">
                {/* Standard line height icon wrapper */}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h10M4 18h16"></path>
                </svg>
                Line Spacing
              </span>
              {isKidsMode && (
                <span className="text-[10px] font-black text-[#1CABB9] bg-[#1CABB9]/10 px-2 py-0.5 rounded-full">
                  Min 1.8 Enforced
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 bg-gray-50 border border-gray-150 rounded-2xl p-2.5">
              <button
                disabled={isKidsMode}
                onClick={() => setLineHeight(1.45)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isKidsMode
                    ? 'opacity-40 cursor-not-allowed'
                    : effectiveLineHeight === 1.45
                      ? 'bg-white text-[#1CABB9] shadow-sm'
                      : 'text-gray-500 hover:text-[#372f58]'
                }`}
              >
                Compact
              </button>
              <button
                disabled={isKidsMode}
                onClick={() => setLineHeight(1.7)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isKidsMode
                    ? 'opacity-40 cursor-not-allowed'
                    : effectiveLineHeight === 1.7
                      ? 'bg-white text-[#1CABB9] shadow-sm'
                      : 'text-gray-500 hover:text-[#372f58]'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setLineHeight(2.0)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isKidsMode && effectiveLineHeight === 2.0
                    ? 'bg-white text-[#1CABB9] shadow-sm'
                    : effectiveLineHeight === 2.0 && !isKidsMode
                      ? 'bg-white text-[#1CABB9] shadow-sm'
                      : 'text-gray-500 hover:text-[#372f58]'
                }`}
              >
                Loose
              </button>
            </div>
          </div>

          {/* Task 3.3: Dynamic Font Family Selector */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-[#372f58]/80 uppercase tracking-wider">
              Font Style
            </span>
            
            {/* Horizontally scrollable row of sleek pill buttons */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
              {currentFonts.map((font) => {
                const isSelected = font.name === effectiveFontFamily;
                return (
                  <button
                    key={font.name}
                    onClick={() => setFontFamily(font.name)}
                    style={{ fontFamily: font.name }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? isKidsMode
                          ? 'bg-[#1CABB9] border-[#1CABB9] text-white shadow-md'
                          : 'bg-[#372f58] border-[#372f58] text-white shadow-md'
                        : 'bg-white border-gray-150 text-[#372f58] hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{font.name}</span>
                    {isSelected && <Check size={10} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
