'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, getCategories, uploadImage } from '@/lib/api';
import { formatINR } from '@/lib/data';

const FALLBACK_CATEGORIES = [
  { slug: 'pottery', name: 'Pottery' },
  { slug: 'textiles', name: 'Textiles' },
  { slug: 'woodwork', name: 'Woodwork' },
  { slug: 'jewellery', name: 'Jewellery' },
  { slug: 'home-decor', name: 'Home Decor' },
  { slug: 'handloom', name: 'Handloom' },
  { slug: 'bamboo-cane', name: 'Bamboo & Cane' },
];

export default function ArtisanProductsPage() {
  const { user, ready, token, logout } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [defaultRegion, setDefaultRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state (used for both create and edit)
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('pottery');
  const [stock, setStock] = useState('20');
  const [region, setRegion] = useState('');
  const [materials, setMaterials] = useState('');
  const [care, setCare] = useState('');
  const [description, setDescription] = useState('');
  const [gallery, setGallery] = useState([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const me = await api('/seller/me', { token });
      const artisanRegion = me?.region || '';
      setDefaultRegion(artisanRegion);
      setRegion((prev) => prev || artisanRegion);

      const [list, cats] = await Promise.all([
        api('/seller/products', { token }),
        getCategories().catch(() => FALLBACK_CATEGORIES),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      if (Array.isArray(cats) && cats.length) setCategories(cats);
    } catch (err) {
      if (err?.status === 404) {
        router.replace('/artisan/onboarding');
        return;
      }
      if (err?.status === 401) {
        logout();
        router.replace('/login');
        return;
      }
      if (err?.status === 403) {
        router.replace('/');
        return;
      }
      setError(err?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [token, router, logout]);

  useEffect(() => {
    if (!ready || !user || !token) return;
    loadProducts();
  }, [ready, user, token, loadProducts]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory(categories[0]?.slug || 'pottery');
    setStock('20');
    setRegion(defaultRegion);
    setMaterials('');
    setCare('');
    setDescription('');
    setGallery([]);
    setFormError('');
  };

  const startEdit = (product) => {
    const prodId = product.id || product._id;
    setEditingId(prodId);
    setName(product.name || '');
    setPrice(String(product.price ?? ''));
    setCategory(product.category || categories[0]?.slug || 'pottery');
    setStock(String(product.stock ?? 20));
    setRegion(product.region || defaultRegion);
    setMaterials(product.materials || '');
    setCare(product.care || '');
    setDescription(product.description || '');
    const imgs = Array.isArray(product.gallery) && product.gallery.length
      ? product.gallery.filter(Boolean)
      : product.image
        ? [product.image]
        : [];
    setGallery(imgs.slice(0, 4));
    setFormError('');
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - gallery.length;
    if (remaining <= 0) {
      setFormError('Maximum 4 images allowed per product.');
      return;
    }
    setFormError('');
    setUploadingImg(true);
    try {
      const uploaded = [];
      for (const file of files.slice(0, remaining)) {
        const res = await uploadImage(file, token);
        if (res?.url) uploaded.push(res.url);
      }
      setGallery((prev) => [...prev, ...uploaded].slice(0, 4));
    } catch (err) {
      setFormError(err?.message || 'Failed to upload image.');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      category,
      stock: stock === '' ? 20 : parseInt(stock, 10),
      region: region.trim() || defaultRegion,
      materials: materials.trim(),
      care: care.trim(),
      description: description.trim(),
      gallery,
      image: gallery[0] || '',
    };
    try {
      if (editingId) {
        const updated = await api(`/seller/products/${editingId}`, {
          method: 'PUT',
          body: payload,
          token,
        });
        setProducts((prev) =>
          prev.map((p) => ((p.id || p._id) === editingId ? updated : p))
        );
      } else {
        const created = await api('/seller/products', {
          method: 'POST',
          body: payload,
          token,
        });
        setProducts((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setFormError(err?.message || 'Could not save product.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (product) => {
    const prodId = product.id || product._id;
    setFormError('');
    try {
      await api(`/seller/products/${prodId}`, { method: 'DELETE', token });
      setProducts((prev) => prev.filter((p) => (p.id || p._id) !== prodId));
      if (editingId === prodId) resetForm();
    } catch (err) {
      setFormError(err?.message || 'Could not delete product.');
    }
  };

  const inputClass =
    'w-full border hairline rounded-md px-4 py-2.5 text-sm bg-white/70 focus:outline-none focus:border-terracotta';

  if (loading) {
    return (
      <div className="container-page py-14 lg:py-20">
        <p className="text-sm text-brown/60">Loading your products…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="max-w-lg border hairline rounded-sm p-8 bg-white/50">
          <h1 className="font-display text-2xl text-brown mb-2">My Products</h1>
          <p role="alert" className="text-sm text-terracotta mb-5">{error}</p>
          <button onClick={loadProducts} className="btn-primary rounded-full px-6 py-2.5 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mb-10">
        <p className="text-terracotta text-sm mb-2">Artisan Studio</p>
        <h1 className="font-display text-3xl sm:text-4xl text-brown">My Products</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] items-start">
        {/* Product list */}
        <div>
          {products.length === 0 ? (
            <div className="border hairline rounded-sm p-10 bg-white/50 text-center">
              <Package size={34} className="mx-auto text-brown/30 mb-4" strokeWidth={1.3} />
              <h2 className="font-display text-2xl text-brown mb-2">No products yet</h2>
              <p className="text-sm text-brown/60">
                Use the form to list your first handmade piece for customers to discover.
              </p>
            </div>
          ) : (
            <div className="border hairline rounded-sm bg-white/50 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b hairline text-xs uppercase tracking-wider text-brown/55">
                    <th className="py-3.5 px-5 font-medium">Product</th>
                    <th className="py-3.5 px-4 font-medium">Category</th>
                    <th className="py-3.5 px-4 font-medium">Stock</th>
                    <th className="py-3.5 px-4 font-medium">Price</th>
                    <th className="py-3.5 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y hairline text-sm">
                  {products.map((p) => {
                    const prodId = p.id || p._id;
                    return (
                      <tr key={prodId} className="hover:bg-beige/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {p.image && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={p.image} alt={p.name} className="w-10 h-10 rounded-sm object-cover bg-beige shrink-0" />
                            )}
                            <div>
                              <p className="text-brown font-medium">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-brown/55 line-clamp-1 mt-0.5">{p.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-brown/75 capitalize">{p.category}</td>
                        <td className="py-4 px-4 text-brown/75">{p.stock ?? 20}</td>
                        <td className="py-4 px-4 text-brown">{formatINR(p.price ?? 0)}</td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEdit(p)}
                            aria-label={`Edit ${p.name}`}
                            className="inline-flex items-center gap-1 text-xs text-forest hover:underline mr-4"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            aria-label={`Delete ${p.name}`}
                            className="inline-flex items-center gap-1 text-xs text-terracotta hover:underline"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add / Edit form */}
        <div className="border hairline rounded-sm p-6 sm:p-8 bg-white/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-brown">
              {editingId ? 'Edit Product' : 'Add Product'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-brown/60 hover:text-terracotta inline-flex items-center gap-1"
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Product Name *</label>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hand-painted Clay Vase"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-brown/60 mb-1.5">Price (₹) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1200"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-brown/60 mb-1.5">Stock</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="20"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Category *</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Region</label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Jaipur, Rajasthan"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Photos (up to 4)</label>
              {gallery.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {gallery.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative w-16 h-16 rounded-sm overflow-hidden border hairline bg-beige">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label={`Remove image ${idx + 1}`}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-cream/90 text-brown flex items-center justify-center hover:text-terracotta"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {gallery.length < 4 && (
                <label className="inline-flex items-center gap-2 border hairline rounded-full px-4 py-2 text-xs text-brown hover:border-terracotta hover:text-terracotta cursor-pointer transition-colors">
                  <Upload size={14} />
                  {uploadingImg ? 'Uploading…' : `Upload photos (${gallery.length}/4)`}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingImg}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Materials</label>
              <input
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="e.g., Terracotta clay, natural mineral pigments"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Care Instructions</label>
              <input
                value={care}
                onChange={(e) => setCare(e.target.value)}
                placeholder="e.g., Wipe gently with a dry cloth"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-brown/60 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share the craft technique and story behind this piece."
                className={inputClass}
              />
            </div>

            {formError && (
              <p role="alert" className="text-sm text-terracotta">{formError}</p>
            )}

            <button
              type="submit"
              disabled={busy || uploadingImg}
              className="btn-primary rounded-full px-6 py-3 text-sm w-full inline-flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Plus size={15} />
              {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Add Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
