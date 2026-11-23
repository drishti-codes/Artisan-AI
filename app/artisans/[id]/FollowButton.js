'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function FollowButton({ artisanId }) {
  const [following, setFollowing] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  // Check if this user already follows the artisan
  useEffect(() => {
    if (!token) {
      setFollowing(false);
      return;
    }
    api(`/artisans/${artisanId}/following`, { token })
      .then((data) => setFollowing(data.following))
      .catch(() => {});
  }, [token, artisanId]);

  const handleClick = async () => {
    if (!token) {
      router.push(`/login?next=/artisans/${artisanId}`);
      return;
    }
    try {
      const data = await api(`/artisans/${artisanId}/follow`, { method: 'POST', token });
      setFollowing(data.following);
    } catch (e) {
      window.alert(e.message);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className={`text-sm px-6 py-2.5 rounded-full border transition-colors whitespace-nowrap ${
        following ? 'bg-forest text-cream border-forest' : 'border-forest text-forest hover:bg-forest hover:text-cream'
      }`}
    >
      {following ? 'Following ✓' : 'Follow Artisan'}
    </motion.button>
  );
}
