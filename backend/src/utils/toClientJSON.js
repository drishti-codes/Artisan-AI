// Mongoose plugin: shapes documents for the frontend.
//  - removes _id and __v
//  - if the document has a "slug", returns it as "id" (the frontend uses slugs as ids)
function toClientJSON(schema, options = {}) {
  const keepSlug = options.keepSlug === true; // categories keep "slug" in the response

  schema.set('toJSON', {
    virtuals: false,
    transform(doc, ret) {
      if (ret.slug && !keepSlug) {
        ret.id = ret.slug;
        delete ret.slug;
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
}

module.exports = toClientJSON;