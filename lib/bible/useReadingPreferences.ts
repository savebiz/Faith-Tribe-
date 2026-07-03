import { useState, useEffect } from 'react';

export interface ReadingPreferences {
  isKidsMode: boolean;
  fontSize: number; // base user preference
  fontFamily: string; // base user preference
  lineHeight: number; // base user preference
}

const DEFAULT_PREFERENCES: ReadingPreferences = {
  isKidsMode: false,
  fontSize: 16,
  fontFamily: 'Inter',
  lineHeight: 1.7,
};

export function useReadingPreferences() {
  const [preferences, setPreferences] = useState<ReadingPreferences>(DEFAULT_PREFERENCES);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize and load from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('faith_tribe_reading_prefs');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load reading preferences from localStorage:', e);
    }
  }, []);

  // Persist to localStorage on changes
  const updatePreference = <K extends keyof ReadingPreferences>(
    key: K,
    value: ReadingPreferences[K]
  ) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('faith_tribe_reading_prefs', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save reading preferences to localStorage:', e);
      }
      return updated;
    });
  };

  const setIsKidsMode = (val: boolean) => updatePreference('isKidsMode', val);
  const setFontSize = (val: number) => updatePreference('fontSize', val);
  const setFontFamily = (val: string) => updatePreference('fontFamily', val);
  const setLineHeight = (val: number) => updatePreference('lineHeight', val);

  // Compute effective values (applying Kids Mode shifts if active)
  const isKidsMode = isMounted ? preferences.isKidsMode : DEFAULT_PREFERENCES.isKidsMode;
  const rawFontSize = isMounted ? preferences.fontSize : DEFAULT_PREFERENCES.fontSize;
  const rawFontFamily = isMounted ? preferences.fontFamily : DEFAULT_PREFERENCES.fontFamily;
  const rawLineHeight = isMounted ? preferences.lineHeight : DEFAULT_PREFERENCES.lineHeight;

  // Apply Kids Mode shifts
  const effectiveFontSize = isKidsMode ? Math.max(rawFontSize, 20) : rawFontSize;
  const effectiveLineHeight = isKidsMode ? Math.max(rawLineHeight, 1.8) : rawLineHeight;
  
  const kidsModeFonts = ['Lexend', 'Quicksand', 'Open Sans'];
  const effectiveFontFamily = isKidsMode
    ? kidsModeFonts.includes(rawFontFamily)
      ? rawFontFamily
      : 'Lexend'
    : rawFontFamily;

  return {
    isKidsMode,
    setIsKidsMode,
    fontSize: rawFontSize,
    setFontSize,
    fontFamily: rawFontFamily,
    setFontFamily,
    lineHeight: rawLineHeight,
    setLineHeight,
    effectiveFontSize,
    effectiveFontFamily,
    effectiveLineHeight,
    isMounted,
  };
}
