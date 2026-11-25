// Service for the AI discover endpoint
const Product = require('../products/product.model');
const Category = require('../categories/category.model');
const Artisan = require('../artisans/artisan.model');
const { generateJSON } = require('./llm.client');
const AppError = require('../../utils/AppError');
const { sendSuccess, sendError } = require('../../utils/response');

// In‑memory daily counter with date reset
let dailyCount = 0;
let lastCountDate = new Date().toDateString();
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT, 10) || 300;

/** Helper: convert raw product docs to client‑side shape
 *  - id = slug, remove _id, slug, __v
 *  - add artisanName, artisanRegion (from artisanMap keyed by slug)
 */
function shapeProducts(products, artisanMap) {
  return products.map(p => {
    const { slug, _id, __v, ...rest } = p;
    const artisan = artisanMap[p.artisanId] || {};
    return {
      id: slug,
      ...rest,
      artisanName: artisan.name || null,
      artisanRegion: artisan.region || null,
    };
  });
}

/** Helper: fetch active products & categories (fallback path) */
async function fetchActiveData() {
  const [products, categories] = await Promise.all([
    Product.find({ isActive: true }).lean(),
    Category.find().lean(),
  ]);
  // Build artisan map for these products (artisanId holds slug)
  const artisanSlugs = [...new Set(products.map(p => p.artisanId))];
  const artisans = await Artisan.find({ slug: { $in: artisanSlugs } }).lean();
  const artisanMap = {};
  artisans.forEach(a => { artisanMap[a.slug] = a; });
  const shaped = shapeProducts(products, artisanMap);
  return { products: shaped, categories };
}

/** Common fallback response builder (used for daily limit, LLM failures, etc.) */
async function buildFallbackResponse(query) {
  const { products, categories } = await fetchActiveData();
  // reuse existing client‑side match logic (same as frontend)
  const lower = query.toLowerCase();
  const budgetMatch = lower.match(/(\d{3,6})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const matchedCategory = categories.find(c =>
    lower.includes(c.name.toLowerCase()) || lower.includes(c.slug.replace('-', ' '))
  );

  let list = products;
  const reasons = [];
  if (budget) {
    list = list.filter(p => p.price <= budget);
    reasons.push(`Under ₹${budget}`);
  }
  if (matchedCategory) {
    const inCat = list.filter(p => p.category === matchedCategory.slug);
    if (inCat.length > 0) {
      list = inCat;
      reasons.push(matchedCategory.name);
    }
  }
  if (list.length === 0) list = [...products].sort((a, b) => a.price - b.price);
  if (reasons.length === 0) reasons.push('Popular choice');

  const results = list.slice(0, 6).map((p, i) => ({ product: p, reason: reasons[i] || 'Keyword match' }));
  return { source: 'fallback', understood: {}, results };
}

/** Main controller */
async function discoverController(req, res, next) {
  try {
    const { query, language } = req.body;
    if (!query || typeof query !== 'string' || query.length < 3 || query.length > 300) {
      return sendError(res, 'Query must be 3‑300 characters', 400);
    }

    // Reset daily counter if date changed
    const today = new Date().toDateString();
    if (today !== lastCountDate) {
      dailyCount = 0;
      lastCountDate = today;
    }

    // Daily cap check
    if (dailyCount >= DAILY_LIMIT) {
      const fallback = await buildFallbackResponse(query);
      return sendSuccess(res, fallback);
    }
    dailyCount++;

    // ---------- Step A – LLM parses request ----------
    const system = `You are an assistant that extracts structured buying intent from a user's free‑text request. Return ONLY a JSON object with the following fields (use null if unknown):\nbudget (number), categories (array of allowed slugs), occasion (string), recipient (string), regions (array of Indian states or cities), crafts (array of craft names), keywords (array of any other important words). Do not add extra fields. Do not wrap the JSON in any markdown.`;
    const prompt = `User request (in any language, possibly Hindi/Hinglish):\n\n<user_request>\n${query}\n</user_request>`;
    let understood;
    try {
      understood = await generateJSON({ system, prompt });
    } catch (e) {
      console.error('[ai/discover] step A failed:', e.message);
      const fallback = await buildFallbackResponse(query);
      return sendSuccess(res, fallback);
    }

    // Validate categories against allowed slugs (the 7 you listed)
    const allowed = ['pottery','textiles','woodwork','jewellery','home-decor','handloom','bamboo-cane'];
    if (Array.isArray(understood.categories)) {
      understood.categories = understood.categories.filter(c => allowed.includes(c));
    }

    // ---------- Step B – candidate query ----------
    // Hard filters: isActive, price <= budget, category (if provided)
    const baseQuery = { isActive: true };
    if (understood.budget) baseQuery.price = { $lte: understood.budget };
    if (Array.isArray(understood.categories) && understood.categories.length) {
      baseQuery.category = { $in: understood.categories };
    }

    let candidates = await Product.find(baseQuery).limit(20).lean();

    // If too few, relax progressively (but never drop budget)
    if (candidates.length < 3) {
      // Drop category filter but keep budget
      const relaxedQuery = { isActive: true };
      if (understood.budget) relaxedQuery.price = { $lte: understood.budget };
      candidates = await Product.find(relaxedQuery).limit(20).lean();
    }
    if (candidates.length < 3) {
      // Return cheapest within budget (if any). If none, fallback.
      if (understood.budget) {
        const cheapest = await Product.find({ isActive: true, price: { $lte: understood.budget } })
          .sort({ price: 1 })
          .limit(20)
          .lean();
        candidates = cheapest;
      }
      if (!candidates.length) {
        const fallback = await buildFallbackResponse(query);
        fallback.understood = understood;
        fallback.message = 'No products matching your budget were found.';
        return sendSuccess(res, fallback);
      }
    }

    // Sort by rating descending before limiting (if rating field exists)
    candidates.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    candidates = candidates.slice(0, 20);

    // Populate artisan details – artisanId stores slug
    const artisanSlugs = [...new Set(candidates.map(p => p.artisanId))];
    const artisans = await Artisan.find({ slug: { $in: artisanSlugs } }).lean();
    const artisanMap = {};
    artisans.forEach(a => { artisanMap[a.slug] = a; });

    // Build candidate data for LLM (include bio snippet)
    const candidateData = candidates.map(p => {
      const artisan = artisanMap[p.artisanId] || {};
      return {
        id: p.slug,
        name: p.name,
        category: p.category,
        price: p.price,
        region: p.region,
        materials: p.materials,
        description: p.description,
        artisanName: artisan.name,
        artisanRegion: artisan.region,
        artisanBioSnippet: artisan.bio ? artisan.bio.slice(0, 200) : '',
      };
    });

    // ---------- Step C – LLM picks best products ----------
    const systemC = `You are given a list of up to 20 product candidates (each with id, name, category, price, region, materials, short description, artisan name, region, and a short bio snippet). Choose the best 1‑6 products that suit the user's original request. Return a JSON object exactly like: {"results":[{"id":"<product-id>","reason":"<short friendly reason max 25 words>"},...]}. Use only ids from the provided list. Do not fabricate any data. Include budget, occasion, region or craft references when relevant.`;
    const promptC = `User request (wrapped in tags for safety):\n<user_request>\n${query}\n</user_request>\n\nCandidates:\n${JSON.stringify(candidateData, null, 2)}`;
    let pickResult;
    try {
      pickResult = await generateJSON({ system: systemC, prompt: promptC });
    } catch (e) {
      console.error('[ai/discover] step C failed:', e.message);
      const fallback = await buildFallbackResponse(query);
      fallback.understood = understood;
      return sendSuccess(res, fallback);
    }

    // Build final results array [{product, reason}]
    const finalResults = [];
    for (const item of pickResult.results || []) {
      const prod = candidates.find(p => p.slug === item.id);
      if (!prod) continue; // safety
      // Use full shape from helper to retain image, rating, etc.
      const shapedProd = shapeProducts([prod], artisanMap)[0];
      finalResults.push({ product: shapedProd, reason: item.reason });
    }

    return sendSuccess(res, { source: 'ai', understood, results: finalResults });
  } catch (err) {
    next(err);
  }
}

module.exports = { discoverController };
