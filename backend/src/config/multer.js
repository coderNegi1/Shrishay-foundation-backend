/**
 * Multer Configuration
 * Handles file upload settings for images and videos
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadDirs = {
  images: path.join(__dirname, '../../uploads/images'),
  videos: path.join(__dirname, '../../uploads/videos')
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on file type
    const isVideo = file.mimetype.startsWith('video/');
    const uploadPath = isVideo ? uploadDirs.videos : uploadDirs.images;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50); // Limit filename length
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const allowedVideoTypes = process.env.ALLOWED_VIDEO_TYPES?.split(',') || [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo'
  ];

  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Create multer upload instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files per request
  }
});

// Middleware for handling different upload scenarios
export const uploadMiddleware = {
  // Single image upload
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple images upload
  multiple: (fieldName, maxCount = 10) => upload.array(fieldName, maxCount),
  
  // Mixed fields upload (for complex forms)
  fields: (fields) => upload.fields(fields)
};

// Helper function to delete uploaded file
export const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
