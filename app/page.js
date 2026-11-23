import Hero from '@/components/home/Hero';
import WhyChoose from '@/components/home/WhyChoose';
import CategorySection from '@/components/home/CategorySection';
import OurStory from '@/components/home/OurStory';
import AIDiscoveryTeaser from '@/components/home/AIDiscoveryTeaser';
import ProductCard from '@/components/ProductCard';
import ArtisanCard from '@/components/ArtisanCard';
import Link from 'next/link';
import { api, getArtisans, getCategories, attachArtisanNames } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [artisans, productData, categories] = await Promise.all([getArtisans(), api('/products?limit=8'), getCategories()]);
  const products = attachArtisanNames(productData.items, artisans);

  return (
    <>
      <Hero />
      <WhyChoose />
      <CategorySection categories={categories} />

      <section className="container-page py-16 lg:py-20 border-t hairline">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-terracotta text-sm mb-2">Featured Artisans</p>
            <h2 className="font-display text-3xl sm:text-4xl text-brown">The people behind the craft</h2>
          </div>
          <Link href="/artisans" className="hidden sm:block text-sm text-terracotta hover:underline underline-offset-4">
            Meet all artisans
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {artisans.map((artisan, i) => (
            <ArtisanCard key={artisan.id} artisan={artisan} index={i} />
          ))}
        </div>
      </section>

      <section className="container-page py-16 lg:py-20 border-t hairline">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-terracotta text-sm mb-2">Featured Products</p>
            <h2 className="font-display text-3xl sm:text-4xl text-brown">Popular handmade creations</h2>
          </div>
          <Link href="/shop" className="hidden sm:block text-sm text-terracotta hover:underline underline-offset-4">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {products.slice(0, 8).map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      <OurStory />
      <AIDiscoveryTeaser />
    </>
  );
}
