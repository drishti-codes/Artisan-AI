const Product = require('../products/product.model');
const AppError = require('../../utils/AppError');

// The artisan's products with a lowStock flag
async function listForSeller(artisanId) {
  const products = await Product.find({ artisanId }).sort({ _id: 1 });
  return products.map((p) => ({
    id: p.slug,
    name: p.name,
    image: p.image,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    soldCount: p.soldCount,
    isActive: p.isActive,
    lowStock: p.stock <= p.lowStockThreshold,
  }));
}

async function updateStock(artisanId, slug, stock) {
  const product = await Product.findOne({ slug: String(slug).toLowerCase(), artisanId });
  if (!product) throw new AppError('Product not found in your shop', 404);
  product.stock = stock;
  await product.save();
  return { id: product.slug, stock: product.stock, lowStock: product.stock <= product.lowStockThreshold };
}

module.exports = { listForSeller, updateStock };
