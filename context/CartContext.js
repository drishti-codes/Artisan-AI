'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'artisanai-cart'; // guest cart (before login)

const fromServer = (cart) =>
  cart.items.map((i) => ({ id: i.id, name: i.name, price: i.price, image: i.image, qty: i.qty }));

export function CartProvider({ children }) {
  const { token, ready } = useAuth();
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const hadToken = useRef(false);

  // 1. Load the guest cart from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // 2. Guests: keep the cart in localStorage. Logged-in users: the server keeps it.
  useEffect(() => {
    if (!hydrated || token) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // storage unavailable: cart still works in memory
    }
  }, [items, hydrated, token]);

  // 3. When the user logs in: merge the guest cart into the server cart. On logout: empty the screen cart.
  useEffect(() => {
    if (!ready) return;
    if (!token) {
      if (hadToken.current) setItems([]);
      hadToken.current = false;
      return;
    }
    hadToken.current = true;

    let guest = [];
    try {
      guest = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      guest = [];
    }
    const request =
      guest.length > 0
        ? api('/cart/merge', { method: 'POST', token, body: { items: guest.map((i) => ({ id: i.id, qty: i.qty })) } })
        : api('/cart', { token });

    request
      .then((cart) => {
        setItems(fromServer(cart));
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          // ignore
        }
      })
      .catch(() => {
        // keep what is on screen if the server cannot be reached
      });
  }, [token, ready]);

  const serverCall = useCallback(
    async (path, method, body) => {
      try {
        const cart = await api(path, { method, token, body });
        setItems(fromServer(cart));
      } catch (e) {
        window.alert(e.message);
      }
    },
    [token]
  );

  const addItem = useCallback(
    (product, qty = 1) => {
      if (token) {
        serverCall('/cart/items', 'POST', { productId: product.id, qty });
        return;
      }
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
        }
        return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, qty }];
      });
    },
    [token, serverCall]
  );

  const removeItem = useCallback(
    (id) => {
      if (token) {
        serverCall(`/cart/items/${id}`, 'DELETE');
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [token, serverCall]
  );

  const updateQty = useCallback(
    (id, qty) => {
      const safeQty = Math.max(1, qty);
      if (token) {
        serverCall(`/cart/items/${id}`, 'PATCH', { qty: safeQty });
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: safeQty } : i)));
    },
    [token, serverCall]
  );

  // Used after an order is paid (the server clears its own cart on payment)
  const clearCart = useCallback(() => {
    setItems([]);
    if (token) api('/cart', { method: 'DELETE', token }).catch(() => {});
  }, [token]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items]);

  const value = { items, addItem, removeItem, updateQty, clearCart, count, subtotal, hydrated };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
