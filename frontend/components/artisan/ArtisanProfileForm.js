'use client';

import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { getCategories, uploadImage } from '@/lib/api';

const FALLBACK_CATEGORIES = [
  { slug: 'pottery', name: 'Pottery' },
  { slug: 'textiles', name: 'Textiles' },
  { slug: 'woodwork', name: 'Woodwork' },
  { slug: 'jewellery', name: 'Jewellery' },
  { slug: 'home-decor', name: 'Home Decor' },
  { slug: 'handloom', name: 'Handloom' },
  { slug: 'bamboo-cane', name: 'Bamboo & Cane' },
];

// Shared field definitions (reused by onboarding, profile edit, and future voice onboarding)
export const ARTISAN_PROFILE_FIELDS = [
  { name: 'name', label: 'Your name', type: 'text', required: true, minLength: 2, maxLength: 60, placeholder: 'e.g., Ramesh Kumar' },
  { name: 'shopName', label: 'Shop name', type: 'text', required: true, minLength: 2, maxLength: 80, placeholder: 'e.g., Jaipur Blue Pottery Studio' },
  { name: 'craft', label: 'Craft / Category', type: 'category-select', required: true },
  { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Jaipur' },
  { name: 'state', label: 'State', type: 'text', required: true, placeholder: 'e.g., Rajasthan' },
  { name: 'years', label: 'Years of Experience', type: 'number', required: false, min: 0, placeholder: 'e.g., 12' },
  { name: 'bio', label: 'Short Bio', type: 'textarea', required: false, rows: 3, placeholder: 'A short introduction to your craft and workshop.' },
  {
    name: 'image',
    label: 'Profile Photo',
    type: 'image',
    required: false,
    circular: true,
    helperText: 'Your photo appears on your artisan card. If you skip it, your initials are shown.',
  },
  { name: 'cover', label: 'Cover Photo', type: 'image', required: false },
  { name: 'storyTitle', label: 'My Story — Title', type: 'text', required: false, placeholder: 'e.g., Three Generations of Handcrafted Clay' },
  { name: 'storyBody', label: 'My Story — Your Journey', type: 'textarea', required: false, rows: 5, placeholder: 'Share how you learned your craft and what inspires your work.' },
];

export default function ArtisanProfileForm({
  initialValues = {},
  defaultName = '',
  token,
  onSubmit,
  submitLabel = 'Save Profile',
  busy = false,
  error = '',
  successMsg = '',
}) {
  const [values, setValues] = useState({
    name: initialValues.name || defaultName || '',
    shopName: initialValues.shopName || '',
    craft: initialValues.craft || '',
    city: initialValues.city || '',
    state: initialValues.state || '',
    years: initialValues.years !== undefined && initialValues.years !== null ? String(initialValues.years) : '',
    bio: initialValues.bio || initialValues.description || '',
    image: initialValues.image || '',
    cover: initialValues.cover || '',
    storyTitle: initialValues.storyTitle || '',
    storyBody: initialValues.storyBody || '',
  });
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [uploadingField, setUploadingField] = useState('');
  const [uploadErr, setUploadErr] = useState('');

  useEffect(() => {
    getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  const setField = (name, val) => setValues((prev) => ({ ...prev, [name]: val }));

  const handleFileChange = async (fieldName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    setUploadingField(fieldName);
    try {
      const res = await uploadImage(file, token);
      if (res?.url) setField(fieldName, res.url);
    } catch (err) {
      setUploadErr(err?.message || 'Could not upload image.');
    } finally {
      setUploadingField('');
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: values.name.trim(),
      shopName: values.shopName.trim(),
      craft: values.craft.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      years: values.years === '' ? 0 : Number(values.years),
      bio: values.bio.trim(),
      image: values.image.trim(),
      cover: values.cover.trim(),
      storyTitle: values.storyTitle.trim(),
      storyBody: values.storyBody.trim(),
    });
  };

  const inputClass =
    'w-full border hairline rounded-md px-4 py-2.5 text-sm bg-white/70 focus:outline-none focus:border-terracotta';

  return (
    <form onSubmit={handleSubmit} className="border hairline rounded-sm p-6 sm:p-8 bg-white/50 space-y-5">
      {ARTISAN_PROFILE_FIELDS.map((field) => {
        if (field.type === 'category-select') {
          return (
            <div key={field.name}>
              <label className="block text-sm text-brown/60 mb-1.5">
                {field.label}{field.required ? ' *' : ''}
              </label>
              <select
                required={field.required}
                value={values.craft}
                onChange={(e) => setField('craft', e.target.value)}
                className={inputClass}
              >
                <option value="">Select a craft category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.name}>
              <label className="block text-sm text-brown/60 mb-1.5">
                {field.label}{field.required ? ' *' : ''}
              </label>
              <textarea
                required={field.required}
                rows={field.rows || 3}
                value={values[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={inputClass}
              />
            </div>
          );
        }

        if (field.type === 'image') {
          const url = values[field.name];
          const isUploading = uploadingField === field.name;
          return (
            <div key={field.name}>
              <label className="block text-sm text-brown/60 mb-1.5">{field.label}</label>
              <div className="flex flex-wrap items-center gap-4">
                {url && (
                  <div
                    className={`relative w-20 h-20 overflow-hidden border hairline bg-beige shrink-0 ${
                      field.circular ? 'rounded-full' : 'rounded-sm'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={field.label} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setField(field.name, '')}
                      aria-label={`Remove ${field.label}`}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cream/90 text-brown flex items-center justify-center hover:text-terracotta"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <label className="inline-flex items-center gap-2 border hairline rounded-full px-4 py-2 text-xs text-brown hover:border-terracotta hover:text-terracotta cursor-pointer transition-colors">
                  <Upload size={14} />
                  {isUploading ? 'Uploading…' : url ? 'Replace photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploading}
                    onChange={(e) => handleFileChange(field.name, e)}
                    className="hidden"
                  />
                </label>
              </div>
              {field.helperText && (
                <p className="text-xs text-brown/55 mt-1.5">{field.helperText}</p>
              )}
            </div>
          );
        }

        return (
          <div key={field.name}>
            <label className="block text-sm text-brown/60 mb-1.5">
              {field.label}{field.required ? ' *' : ''}
            </label>
            <input
              type={field.type}
              required={field.required}
              minLength={field.minLength}
              maxLength={field.maxLength}
              min={field.min}
              value={values[field.name]}
              onChange={(e) => setField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          </div>
        );
      })}

      {uploadErr && <p role="alert" className="text-sm text-terracotta">{uploadErr}</p>}
      {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
      {successMsg && <p className="text-sm text-forest">{successMsg}</p>}

      <button
        type="submit"
        disabled={busy || Boolean(uploadingField)}
        className="btn-primary rounded-full px-7 py-3 text-sm w-full sm:w-auto disabled:opacity-70"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
