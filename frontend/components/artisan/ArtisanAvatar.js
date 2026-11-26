'use client';

import { useState } from 'react';
import Image from 'next/image';

export function getNameInitials(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function ArtisanAvatar({
  src,
  name,
  sizeClass = 'w-28 h-28',
  textClass = 'text-2xl',
  className = '',
  sizes = '112px',
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`relative rounded-full overflow-hidden border-2 border-dashed border-terracotta/50 bg-beige flex items-center justify-center shrink-0 ${sizeClass} ${className}`}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name || 'Artisan'}
          fill
          sizes={sizes}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <span className={`font-display text-forest select-none ${textClass}`}>
          {getNameInitials(name)}
        </span>
      )}
    </div>
  );
}
