'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const { user, ready, login, register, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const inputClass = 'w-full border hairline rounded-md px-4 py-2.5 text-sm bg-white/70 focus:outline-none focus:border-terracotta';

  // Where to go after login (for example /checkout). Only internal paths are allowed.
  const nextPath = () => {
    const next = new URLSearchParams(window.location.search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      router.push(nextPath());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setError('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  // Already logged in
  if (ready && user) {
    return (
      <div className="container-page py-16 lg:py-24 flex justify-center">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl text-brown mb-2">Hello, {user.name}</h1>
          <p className="text-sm text-brown/55 mb-8">You are signed in as {user.email}.</p>
          <Link href="/shop" className="btn-primary rounded-full px-6 py-3 text-sm w-full block mb-3">
            Continue shopping
          </Link>
          <Link href="/orders" className="w-full border hairline rounded-full px-6 py-3 text-sm hover:border-terracotta hover:text-terracotta transition-colors block mb-3">
            My orders
          </Link>
          {user.role === 'artisan' && (
            <Link href="/seller" className="w-full border hairline rounded-full px-6 py-3 text-sm hover:border-terracotta hover:text-terracotta transition-colors block mb-3">
              Seller dashboard
            </Link>
          )}
          <button onClick={logout} className="w-full border hairline rounded-full px-6 py-3 text-sm hover:border-terracotta hover:text-terracotta transition-colors">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-16 lg:py-24 flex justify-center">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-brown text-center mb-2">
          {mode === 'login' ? 'Welcome to ArtisanAI' : 'Create your account'}
        </h1>
        <p className="text-sm text-brown/55 text-center mb-8">
          {mode === 'login' ? 'Sign in to track orders and save favourites.' : 'Join to shop handmade and support artisans directly.'}
        </p>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {mode === 'register' && (
              <div>
                <label className="text-sm text-brown/60 block mb-1.5">Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
            )}
            <div>
              <label className="text-sm text-brown/60 block mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-brown/60 block mb-1.5">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-sm text-brown/60 block mb-1.5">Confirm password</label>
                <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <a href="#" className="text-xs text-terracotta hover:underline underline-offset-4">Forgot password?</a>
              </div>
            )}

            {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary rounded-full px-6 py-3 text-sm w-full disabled:opacity-70">
              {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-brown/10" />
          <span className="text-xs text-brown/40">OR</span>
          <div className="h-px flex-1 bg-brown/10" />
        </div>

        <button className="w-full border hairline rounded-full px-6 py-3 text-sm hover:border-terracotta hover:text-terracotta transition-colors">
          Continue with Google
        </button>

        <p className="text-center text-sm text-brown/60 mt-8">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={switchMode} className="text-terracotta hover:underline underline-offset-4">
            {mode === 'login' ? 'Create account' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
