import { cache } from 'react';
import { notFound } from 'next/navigation';
import { api, getArtisans, attachArtisanNames } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

// cache() makes sure the product is fetched only once per page visit (the backend counts views)
const loadProduct = cache(async (id) => {
  try {
    return await api(`/products/${id}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
});

export async function generateMetadata({ params }) {
  const product = await loadProduct(params.id);
  return { title: product ? `${product.name} — ArtisanAI` : 'Product — ArtisanAI' };
}

export default async function ProductDetailsPage({ params }) {
  const product = await loadProduct(params.id);
  if (!product) notFound();

  const [artisans, relatedProducts] = await Promise.all([getArtisans(), api(`/products/${params.id}/related`)]);
  const artisan = artisans.find((a) => a.id === product.artisanId);
  if (!artisan) notFound();
  if (!product.gallery || product.gallery.length === 0) product.gallery = [product.image];
  const related = attachArtisanNames(relatedProducts, artisans);

  return <ProductDetailClient product={product} artisan={artisan} related={related} />;
}
