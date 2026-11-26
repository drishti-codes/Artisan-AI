import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { cache } from 'react';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ArtisanAvatar from '@/components/artisan/ArtisanAvatar';
import FollowButton from './FollowButton';

export const dynamic = 'force-dynamic';

const loadArtisan = cache(async (id) => {
  try {
    return await api(`/artisans/${id}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
});

export async function generateMetadata({ params }) {
  const artisan = await loadArtisan(params.id);
  return { title: artisan ? `${artisan.name} — ArtisanAI` : 'Artisan — ArtisanAI' };
}

export default async function ArtisanProfilePage({ params }) {
  const artisan = await loadArtisan(params.id);
  if (!artisan) notFound();
  const artisanProducts = (await api(`/artisans/${artisan.id}/products`)).map((p) => ({ ...p, artisanName: artisan.name }));

  const hasStory = Boolean(artisan.story && artisan.story.trim());
  const hasProcess = Boolean(artisan.process && artisan.process.trim());
  const hasBio = Boolean(artisan.bio && artisan.bio.trim());

  return (
    <div>
      <div className="relative h-[42vh] min-h-[280px] bg-gradient-to-br from-forest via-forest-light to-brown">
        {artisan.cover && (
          <Image src={artisan.cover} alt={artisan.region} fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-brown/40" />
      </div>

      <div className="container-page -mt-20 relative pb-16">
        <div className="bg-cream border hairline rounded-sm p-6 sm:p-10 flex flex-col sm:flex-row gap-8 items-start">
          <ArtisanAvatar
            src={artisan.image}
            name={artisan.name}
            sizeClass="w-28 h-28"
            textClass="text-3xl"
            className="-mt-16 sm:-mt-24 shadow-md"
            sizes="112px"
          />
          <div className="flex-1">
            <h1 className="font-display text-3xl sm:text-4xl text-brown">{artisan.name}</h1>
            {artisan.shopName && (
              <p className="text-sm text-brown/65 mt-0.5">{artisan.shopName}</p>
            )}
            <p className="text-terracotta mt-1">{artisan.craft}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-brown/60">
              <span className="flex items-center gap-1"><MapPin size={13} /> {artisan.region}</span>
              {artisan.rating > 0 ? (
                <span className="flex items-center gap-1"><Star size={13} className="fill-gold text-gold" /> {artisan.rating}</span>
              ) : (
                <span>New artisan</span>
              )}
              {artisan.years > 0 && (
                <span>{artisan.years === 1 ? '1 year of practice' : `${artisan.years} years of practice`}</span>
              )}
            </div>
            {hasBio && (
              <p className="font-display italic text-lg text-brown/80 mt-5 max-w-lg leading-snug">
                "{artisan.bio}"
              </p>
            )}
          </div>
          <FollowButton artisanId={artisan.id} />
        </div>

        {(hasStory || hasProcess) && (
          <div className="grid lg:grid-cols-2 gap-10 mt-14">
            {hasStory && (
              <div>
                <p className="text-terracotta text-sm mb-2">The Story</p>
                <p className="text-brown/65 leading-relaxed whitespace-pre-line">{artisan.story}</p>
              </div>
            )}
            {hasProcess && (
              <div>
                <p className="text-terracotta text-sm mb-2">The Craft</p>
                <p className="text-brown/65 leading-relaxed whitespace-pre-line">{artisan.process}</p>
              </div>
            )}
          </div>
        )}

        {artisanProducts.length > 0 && (
          <div className="mt-16 pt-14 border-t hairline">
            <h2 className="font-display text-2xl sm:text-3xl text-brown mb-8">
              Products by {artisan.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
              {artisanProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 pt-10 border-t hairline text-center">
          <Link href="/artisans" className="text-sm text-terracotta hover:underline underline-offset-4">
            ← Back to all artisans
          </Link>
        </div>
      </div>
    </div>
  );
}
