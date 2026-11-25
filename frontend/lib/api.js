// Talks to the ArtisanAI backend. Works in server components and in client components.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (e) {
    throw new ApiError('Cannot reach the server. Please make sure the backend is running.', 0);
  }

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // response was not JSON
  }
  if (!res.ok || !json || json.success === false) {
    const details = json && Array.isArray(json.errors) && json.errors.length ? `: ${json.errors.join(', ')}` : '';
    throw new ApiError(((json && json.message) || 'Something went wrong') + details, res.status);
  }
  return json.data;
}

export const getCategories = () => api('/categories');
export const getArtisans = () => api('/artisans');

// The product cards show the artisan's name, so we add it to each product.
export function attachArtisanNames(products, artisans) {
  const names = Object.fromEntries(artisans.map((a) => [a.id, a.name]));
  return products.map((p) => ({ ...p, artisanName: names[p.artisanId] }));
}
