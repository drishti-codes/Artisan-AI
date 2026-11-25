'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Mic, Square } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { api, getCategories, getArtisans, attachArtisanNames } from '@/lib/api';
import { useLanguage } from '@/lib/language';

const prompts = [
  'A gift for my mother under ₹2000 for Diwali. She likes traditional home decor.',
  'Something under ₹1500 for a housewarming gift, handloom or textile.',
  "A statement jewellery piece under ₹1200 for a friend’s birthday.",
];

function matchProducts(text, products, categories) {
  const lower = text.toLowerCase();
  const budgetMatch = lower.match(/(\d{3,6})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;

  const matchedCategory = categories.find((c) =>
    lower.includes(c.name.toLowerCase()) || lower.includes(c.slug.replace('-', ' '))
  );

  const reasons = [];
  let list = products;

  if (budget) {
    list = list.filter((p) => p.price <= budget);
    reasons.push(`Under ₹${budget.toLocaleString('en-IN')}`);
  }
  if (matchedCategory) {
    const inCategory = list.filter((p) => p.category === matchedCategory.slug);
    if (inCategory.length > 0) {
      list = inCategory;
      reasons.push(matchedCategory.name);
    }
  }
  if (lower.includes('gift')) reasons.push('Gift-ready');
  if (lower.includes('diwali') || lower.includes('festival')) reasons.push('Festival-appropriate');
  if (lower.includes('traditional')) reasons.push('Traditional craftsmanship');

  if (list.length === 0) list = [...products].sort((a, b) => a.price - b.price);
  if (reasons.length === 0) reasons.push('Highly rated', 'Made by hand');

  return { results: list.slice(0, 6), reasons };
}

export default function AIDiscoveryClient() {
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Real products and categories from the backend
  const [catalog, setCatalog] = useState({ products: [], categories: [] });
  useEffect(() => {
    Promise.all([api('/products?limit=50'), getCategories(), getArtisans()])
      .then(([productData, categories, artisans]) => {
        setCatalog({ products: attachArtisanNames(productData.items, artisans), categories });
      })
      .catch(() => {});
  }, []);

  // Voice input (Web Speech API). Mic access is requested only on click.
  const { language } = useLanguage();
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stopListening = () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    setVoiceMsg('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceMsg('Voice input isn’t supported in this browser. Please type instead.');
      return;
    }
    const rec = new SR();
    rec.lang = language.speech;
    rec.interimResults = true;
    rec.continuous = false;
    const base = text.trim() ? text.replace(/\s*$/, ' ') : '';
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setText(base + transcript);
    };
    rec.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access was blocked. Allow it in your browser settings, or type instead.',
        'service-not-allowed':
          'Microphone access was blocked. Allow it in your browser settings, or type instead.',
        'no-speech': 'We didn’t hear anything. Tap the mic and try again.',
        'audio-capture': 'No microphone was found on this device.',
        network: 'Voice recognition is unavailable right now. Please type instead.',
      };
      if (event.error !== 'aborted') {
        setVoiceMsg(messages[event.error] || 'Voice input stopped unexpectedly. Please try again or type instead.');
      }
    };
    rec.onend = () => {
      if (recognitionRef.current === rec) recognitionRef.current = null;
      setListening(false);
    };
    try {
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setVoiceMsg('Voice input couldn’t start. Please try again or type instead.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    stopListening();
    setLoading(true);
    setResult(null);
    try {
      const response = await api('/ai/discover', { method: 'POST', body: { query: text } });
      // api() returns the data object directly (no .success flag). Check for results array.
      if (response && Array.isArray(response.results)) {
        setResult(response);
      } else {
        const fallback = matchProducts(text, catalog.products, catalog.categories);
        setResult({
          source: 'fallback',
          understood: {},
          results: fallback.results.map((p, i) => ({ product: p, reason: fallback.reasons[i] || 'Keyword match' })),
        });
      }
    } catch (err) {
      const fallback = matchProducts(text, catalog.products, catalog.categories);
      setResult({
        source: 'fallback',
        understood: {},
        results: fallback.results.map((p, i) => ({ product: p, reason: fallback.reasons[i] || 'Keyword match' })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-14 lg:py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-terracotta text-sm mb-4">
            <Sparkles size={15} /> AI Gift &amp; Product Discovery
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-brown">What are you looking for?</h1>
          <p className="text-brown/60 mt-3">Tell us what you need, in your own words.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="I need a gift for my mother under ₹2000 for Diwali. She likes traditional home decor."
            className="w-full border hairline rounded-md p-5 pr-14 text-sm bg-white/60 focus:outline-none focus:border-terracotta resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={toggleListening}
            aria-label={listening ? 'Stop voice input' : 'Speak your request'}
            aria-pressed={listening}
            title={listening ? 'Stop voice input' : 'Speak your request'}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
              listening ? 'bg-terracotta text-cream animate-pulse' : 'text-brown/60 hover:bg-beige hover:text-terracotta'
            }`}
          >
            {listening ? <Square size={15} fill="currentColor" /> : <Mic size={17} strokeWidth={1.6} />}
          </button>
          <p role="status" aria-live="polite" className={voiceMsg || listening ? 'text-xs text-brown/60 mt-2' : 'sr-only'}>
            {listening ? `Listening in ${language.label}… tap the square to stop.` : voiceMsg}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-full px-7 py-3 text-sm mt-4 mx-auto flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? 'Finding your craft…' : 'Find My Craft'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 justify-center mt-6">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setText(p)}
              className="text-xs border hairline rounded-full px-3 py-1.5 text-brown/60 hover:border-terracotta hover:text-terracotta transition-colors"
            >
              {p.length > 42 ? p.slice(0, 42) + '…' : p}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-14"
            >
              <p className="text-sm text-brown/60 mb-3">
                Based on what you described, we found {result.results.length} handmade {result.results.length === 1 ? 'piece' : 'pieces'}.
              </p>
              {/* Chips for understood criteria when source is AI */}
              {result.source === 'ai' && result.understood && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {result.understood.budget && (
                    <span className="text-xs bg-forest/10 text-forest rounded-full px-3 py-1.5">
                      ✓ Under ₹{result.understood.budget}
                    </span>
                  )}
                  {result.understood.occasion && (
                    <span className="text-xs bg-forest/10 text-forest rounded-full px-3 py-1.5">
                      ✓ {result.understood.occasion}
                    </span>
                  )}
                  {(() => {
                    const seen = new Set();
                    const tags = [
                      ...(Array.isArray(result.understood.categories) ? result.understood.categories : []),
                      ...(Array.isArray(result.understood.crafts) ? result.understood.crafts : []),
                      ...(Array.isArray(result.understood.regions) ? result.understood.regions : []),
                    ].filter((item) => {
                      if (!item || typeof item !== 'string') return false;
                      const key = item.trim().toLowerCase();
                      if (!key || seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                    return tags.map((tag) => (
                      <span key={tag.toLowerCase()} className="text-xs bg-forest/10 text-forest rounded-full px-3 py-1.5">
                        ✓ {tag}
                      </span>
                    ));
                  })()}
                </div>
              )}
              {/* Fallback note */}
              {result.source === 'fallback' && (
                <p className="text-sm text-brown/60 mb-3 italic">Showing keyword matches</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 max-w-4xl mx-auto">
          {result && result.results && result.results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-8">
              {result.results.map((item, i) => (
                <div key={item.product.id} className="flex flex-col items-center">
                  <ProductCard product={item.product} index={i} />
                  <p className="text-xs text-brown/60 mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            result && (
              <p className="text-center text-brown/60 mt-6">No results found for your request.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
