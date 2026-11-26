'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import ArtisanAvatar from '@/components/artisan/ArtisanAvatar';

export default function ArtisanCard({ artisan, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: 'easeOut' }}
    >
      <Link
        href={`/artisans/${artisan.id}`}
        className="group block border hairline rounded-sm p-6 bg-white/50 hover:border-terracotta/60 transition-colors text-center"
      >
        <div className="flex justify-center mb-4">
          <ArtisanAvatar
            src={artisan.image}
            name={artisan.name}
            sizeClass="w-24 h-24"
            textClass="text-2xl"
            sizes="96px"
          />
        </div>
        <p className="font-display text-lg leading-tight text-brown group-hover:text-terracotta transition-colors">
          {artisan.name}
        </p>
        <p className="text-xs text-terracotta mt-1">{artisan.craft}</p>
        {artisan.shopName && (
          <p className="text-xs text-brown/60 mt-0.5">{artisan.shopName}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-brown/55">
          <span>{artisan.region}</span>
          {artisan.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-gold text-gold" /> {artisan.rating}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
