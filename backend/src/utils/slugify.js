// "Hand-thrown Blue Vase!" -> "hand-thrown-blue-vase"
module.exports = function slugify(text) {
  return (
    String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item'
  );
};
