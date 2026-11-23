'use client';

import { useState, useEffect, useCallback } from 'react';

// Languages the browser's Web Speech API can recognise for voice input.
// NOTE: the site's text content is not translated; this only sets the
// language used by the microphone on /ai-discovery.
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', speech: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', speech: 'mr-IN' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', speech: 'bn-IN' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', speech: 'gu-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
];

const KEY = 'artisanai-language';
const EVENT = 'artisanai-language-change';

export function useLanguage() {
  const [code, setCode] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) setCode(saved);
    } catch {}
    const onChange = (e) => setCode(e.detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const select = useCallback((next) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }, []);

  const language = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
  return { language, select };
}
