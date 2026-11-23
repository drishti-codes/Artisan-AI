import { cache } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

const loadStory = cache(async (id) => {
  try {
    return await api(`/stories/${id}`); // includes the artisan
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
});

export async function generateMetadata({ params }) {
  const story = await loadStory(params.id);
  return { title: story ? `${story.title} — ArtisanAI` : 'Story — ArtisanAI' };
}

export default async function StoryDetailsPage({ params }) {
  const story = await loadStory(params.id);
  if (!story || !story.artisan) notFound();
  const artisan = story.artisan;
  const artisanProducts = (await api(`/artisans/${artisan.id}/products`)).map((p) => ({ ...p, artisanName: artisan.name }));

  return (
    <article className="container-page py-12 lg:py-16 max-w-3xl mx-auto">
      <p className="text-terracotta text-sm mb-3 text-center">{story.region} · {artisan.name}</p>
      <h1 className="font-display text-4xl sm:text-5xl text-brown text-center leading-tight text-balance">{story.title}</h1>

      <div className="relative aspect-[16/9] rounded-sm overflow-hidden mt-10 mb-12">
        <Image src={story.image} alt={story.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
      </div>

      <div className="prose-none space-y-8 text-brown/75 leading-relaxed">
        <section>
          <h2 className="font-display text-2xl text-brown mb-2">The Beginning</h2>
          <p>{artisan.bio}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brown mb-2">The Craft</h2>
          <p>{artisan.process}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brown mb-2">The Tradition</h2>
          <p>{artisan.story}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brown mb-2">The Challenges</h2>
          <p>
            Fair pricing, reliable buyers, and reaching customers beyond the local market remain
            the biggest hurdles — the same ones artisans across India face every season.
            ArtisanAI exists to close that gap.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brown mb-2">The Future</h2>
          <p>
            {artisan.name} now sells directly to buyers across the country and beyond, with
            plans to train more apprentices from {artisan.region.split(',')[0]} in the coming
            years.
          </p>
        </section>
      </div>

      {artisanProducts.length > 0 && (
        <div className="mt-16 pt-14 border-t hairline">
          <h2 className="font-display text-2xl text-brown mb-8">Shop products from {artisan.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
            {artisanProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 pt-8 border-t hairline text-center">
        <Link href="/stories" className="text-sm text-terracotta hover:underline underline-offset-4">← Back to stories</Link>
      </div>
    </article>
  );
}
