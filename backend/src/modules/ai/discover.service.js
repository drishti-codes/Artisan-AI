// Service for the AI discover endpoint
const Product = require('../products/product.model');
const Category = require('../categories/category.model');
const Artisan = require('../artisans/artisan.model');
const { generateJSON } = require('./llm.client');
const AppError = require('../../utils/AppError');
const { sendSuccess, sendError } = require('../../utils/response');
const rateLimit = require('express-rate-limit');

// In‑memory daily counter (reset not implemented – simple demo)
let dailyCount = 0;
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT, 10) || 300;

// Helper: simple keyword fallback similar to frontend matchProducts
function fallbackMatch(query, products, categories) {
  const lower = query.toLowerCase();
  const budgetMatch = lower.match(/(\d{3,6})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const matchedCategory = categories.find(c => lower.includes(c.name.toLowerCase()) || lower.includes(c.slug.replace('-', ' ')));
  let list = products;
  if (budget) list = list.filter(p => p.price <= budget);
  if (matchedCategory) list = list.filter(p => p.category === matchedCategory.slug);
  if (list.length === 0) list = [...products].sort((a, b) => a.price - b.price);
  const reasons = [];
  if (budget) reasons.push(`Under ₹${budget}`);
  if (matchedCategory) reasons.push(matchedCategory.name);
  if (reasons.length === 0) reasons.push('Popular choice');
  return { results: list.slice(0, 6), reasons };
}

async function discoverController(req, res, next) {
  try {
    const { query, language } = req.body;
    if (!query || typeof query !== 'string' || query.length < 3 || query.length > 300) {
      return sendError(res, 'Query must be 3‑300 characters', 400);
    }

    // Daily cap check
    if (dailyCount >= DAILY_LIMIT) {
      const { results, reasons } = fallbackMatch(query, req.app.locals.productsCache || [], req.app.locals.categoriesCache || []);
      return sendSuccess(res, { source: 'fallback', understood: {}, results: results.map((p, i) => ({ product: p, reason: reasons[i] || 'Keyword match' })) });
    }
    dailyCount++;

    // Step A – ask LLM to parse request
    const system = `You are an assistant that extracts structured buying intent from a user's free‑text request. Return ONLY a JSON object with the following fields (use null if unknown):\nbudget (number), categories (array of allowed slugs), occasion (string), recipient (string), regions (array of Indian states or cities), crafts (array of craft names), keywords (array of any other important words). Do not add extra fields. Do not wrap the JSON in any markdown.`;
    const prompt = `User request (in any language, possibly Hindi/Hinglish):\n\n<user_request>\n${query}\n</user_request>`;
    let understood;
    try {
      understood = await generateJSON({ system, prompt });
    } catch (e) {
      // fallback on LLM failure
      const { results, reasons } = fallbackMatch(query, req.app.locals.productsCache || [], req.app.locals.categoriesCache || []);
      return sendSuccess(res, { source: 'fallback', understood: {}, results: results.map((p, i) => ({ product: p, reason: reasons[i] || 'Keyword match' })) });
    }

    // Validate categories against allowed slugs (the 7 you listed)
    const allowed = ['pottery','textiles','woodwork','jewellery','home-decor','handloom','bamboo-cane'];
    if (Array.isArray(understood.categories)) {
      understood.categories = understood.categories.filter(c => allowed.includes(c));
    }

    // Step B – query MongoDB for candidates
    const queryObj = { isActive: true };
    if (understood.budget) queryObj.price = { $lte: understood.budget };
    if (understood.categories && understood.categories.length) queryObj.category = { $in: understood.categories };
    if (understood.regions && understood.regions.length) queryObj.region = { $in: understood.regions };
    if (understood.crafts && understood.crafts.length) queryObj.craft = { $in: understood.crafts };

    let candidates = await Product.find(queryObj).limit(20).lean();
    // Relax filters if too few
    if (candidates.length < 3) {
      const relaxed = await Product.find({ isActive: true }).limit(20).lean();
      candidates = relaxed;
    }

    // Populate artisan name/region for each product
    const artisanIds = candidates.map(p => p.artisanId);
    const artisans = await Artisan.find({ _id: { $in: artisanIds } }).lean();
    const artisanMap = {};
    artisans.forEach(a => { artisanMap[a._id] = a; });
    const candidateData = candidates.map(p => ({
      id: p.slug, // assuming toClientJSON will map _id to slug as id
      name: p.name,
      category: p.category,
      price: p.price,
      region: p.region,
      materials: p.materials,
      description: p.description,
      artisanName: artisanMap[p.artisanId]?.name,
      artisanRegion: artisanMap[p.artisanId]?.region,
    }));

    // Step C – ask LLM to pick best products
    const systemC = `You are given a list of up to 20 product candidates (each with id, name, category, price, region, materials, short description, artisan name and region). Choose the best 1‑6 products that suit the user's original request. Return a JSON object exactly like: {"results":[{"id":"<product-id>","reason":"<short friendly reason max 25 words>"},...]}. Use only ids from the provided list. Do not fabricate any data. Include budget, occasion, region or craft references when relevant.`;
    const promptC = `User request: ${query}\n\nCandidates:\n${JSON.stringify(candidateData, null, 2)}`;
    let pickResult;
    try {
      pickResult = await generateJSON({ system: systemC, prompt: promptC });
    } catch (e) {
      // fallback if LLM fails at picking stage
      const { results, reasons } = fallbackMatch(query, req.app.locals.productsCache || [], req.app.locals.categoriesCache || []);
      return sendSuccess(res, { source: 'fallback', understood, results: results.map((p, i) => ({ product: p, reason: reasons[i] || 'Keyword match' })) });
    }

    // Build final response
    const finalResults = [];
    for (const item of pickResult.results || []) {
      const prod = candidates.find(p => p.slug === item.id);
      if (!prod) continue; // safety: skip unknown ids
      // enrich with artisan details
      const artisan = artisanMap[prod.artisanId] || {};
      const fullProd = { ...prod, artisanName: artisan.name, artisanRegion: artisan.region };
      finalResults.push({ product: fullProd, reason: item.reason });
    }

    return sendSuccess(res, { source: 'ai', understood, results: finalResults });
  } catch (err) {
    next(err);
  }
}

module.exports = { discoverController };
