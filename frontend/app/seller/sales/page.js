'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SalesDashboard() {
  const { user, ready } = useAuth();
  const [sales, setSales] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    const fetchSales = async () => {
      try {
        const res = await fetch('/api/seller/sales');
        const json = await res.json();
        if (json.success) setSales(json.data);
        else throw new Error(json.message || 'Failed to load sales');
      } catch (e) {
        setError(e.message);
      }
    };
    fetchSales();
  }, [ready]);

  if (!ready) return null;
  if (!user || user.role !== 'artisan') {
    return <p>Access denied.</p>;
  }

  return (
    <div className="container-page py-16 lg:py-24 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="font-display text-2xl text-brown mb-4">Sales Dashboard</h1>
        {error && <p className="text-terracotta">{error}</p>}
        {sales ? (
          <div className="space-y-4">
            <p><strong>Total Revenue:</strong> $ {sales.totalRevenue}</p>
            <p><strong>Total Orders:</strong> {sales.totalOrders}</p>
            <h2 className="text-xl mt-4 mb-2">Recent Orders</h2>
            {sales.recent && sales.recent.length > 0 ? (
              <ul className="list-disc list-inside">
                {sales.recent.map((order, idx) => (
                  <li key={idx}>Order #{order.id} – $ {order.amount}</li>
                ))}
              </ul>
            ) : (
              <p>No recent orders.</p>
            )}
          </div>
        ) : (
          <p>Loading sales data…</p>
        )}
        <Link href="/seller" className="block text-center mt-4 text-terracotta hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
