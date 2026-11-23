'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'artisanai-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // On page load: if a saved token exists, check it with the backend
  useEffect(() => {
    let saved = null;
    try {
      saved = window.localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      // storage unavailable
    }
    if (!saved) {
      setReady(true);
      return;
    }
    api('/auth/me', { token: saved })
      .then((u) => {
        setToken(saved);
        setUser(u);
      })
      .catch(() => {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch (e) {
          // ignore
        }
      })
      .finally(() => setReady(true));
  }, []);

  const finish = (data) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, data.token);
    } catch (e) {
      // ignore
    }
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login: async (email, password) => finish(await api('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (name, email, password) => finish(await api('/auth/register', { method: 'POST', body: { name, email, password } })),
      logout: () => {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch (e) {
          // ignore
        }
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
