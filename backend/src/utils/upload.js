const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('./AppError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    const randomName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, randomName);
  },
});

function fileFilter(req, file, cb) {
  if (!MIME_TO_EXT[file.mimetype]) {
    return cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
  }
  cb(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

function getPublicUrl(filename) {
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  return `${base}/uploads/${filename}`;
}

module.exports = { uploadImage, getPublicUrl, UPLOAD_DIR };
