/**
 * Media Controller
 * Handles file uploads and media management
 */

import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { deleteFile } from '../config/multer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload single or multiple files
 */
export const uploadFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files uploaded');
  }

  const uploadedMedia = [];

  try {
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      
      // Create media document
      const mediaData = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${isVideo ? 'videos' : 'images'}/${file.filename}`,
        type: isVideo ? 'video' : 'image',
        uploadedBy: req.user._id
      };

      // Get image dimensions if it's an image
      if (!isVideo) {
        try {
          const metadata = await sharp(file.path).metadata();
          mediaData.dimensions = {
            width: metadata.width,
            height: metadata.height
          };

          // Generate thumbnail for large images
          if (metadata.width > 1920 || metadata.height > 1080) {
            const thumbnailName = `thumb-${file.filename}`;
            const thumbnailPath = path.join(
              __dirname, 
              '../../uploads/images', 
              thumbnailName
            );

            await sharp(file.path)
              .resize(400, 300, { fit: 'cover' })
              .toFile(thumbnailPath);

            mediaData.thumbnail = `/uploads/images/${thumbnailName}`;
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }

      const media = await Media.create(mediaData);
      uploadedMedia.push(media);
    }

    res.status(201).json({
      status: 'success',
      message: `${uploadedMedia.length} file(s) uploaded successfully`,
      data: { media: uploadedMedia }
    });
  } catch (error) {
    // Clean up uploaded files on error
    for (const file of req.files) {
      await deleteFile(file.path).catch(console.error);
    }
    throw error;
  }
});

/**
 * Get all media files with pagination
 */
export const getMedia = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    unused = false,
    sort = '-createdAt'
  } = req.query;

  // Build query
  const query = {};
  
  if (type) {
    query.type = type;
  }

  if (unused === 'true') {
    query.$or = [
      { usedIn: { $size: 0 } },
      { usedIn: { $exists: false } }
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [media, total] = await Promise.all([
    Media.find(query)
      .populate('uploadedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Media.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    }
  });
});

/**
 * Get single media file
 */
export const getMediaById = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id)
    .populate('uploadedBy', 'name email')
    .populate('usedIn.modelId');

  if (!media) {
    throw new ApiError(404, 'Media not found');
  }

  res.status(200).json({
    status: 'success',
    data: { media }
  });
});

/**
 * Update media metadata
 */
export const updateMedia = asyncHandler(async (req, res) => {
  const { alt, caption } = req.body;

  const media = await Media.findByIdAndUpdate(
    req.params.id,
    { alt, caption },
    { new: true, runValidators: true }
  );

  if (!media) {
    throw new ApiError(404, 'Media not found');
  }

  res.status(200).json({
    status: 'success',
    message: 'Media updated successfully',
    data: { media }
  });
});

/**
 * Delete media file
 */
export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    throw new ApiError(404, 'Media not found');
  }

  // Check if media is in use
  if (media.isInUse) {
    throw new ApiError(400, 'Cannot delete media that is currently in use');
  }

  try {
    // Delete physical file
    await deleteFile(media.path);

    // Delete thumbnail if exists
    if (media.thumbnail) {
      const thumbnailPath = path.join(
        __dirname,
        '../..',
        media.thumbnail
      );
      await deleteFile(thumbnailPath).catch(() => {});
    }

    // Delete from database
    await media.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media file:', error);
    throw new ApiError(500, 'Failed to delete media file');
  }
});

/**
 * Bulk delete unused media
 */
export const deleteUnusedMedia = asyncHandler(async (req, res) => {
  // Find all unused media
  const unusedMedia = await Media.find({
    $or: [
      { usedIn: { $size: 0 } },
      { usedIn: { $exists: false } }
    ]
  });

  let deletedCount = 0;
  const errors = [];

  for (const media of unusedMedia) {
    try {
      // Delete physical file
      await deleteFile(media.path);

      // Delete thumbnail if exists
      if (media.thumbnail) {
        const thumbnailPath = path.join(
          __dirname,
          '../..',
          media.thumbnail
        );
        await deleteFile(thumbnailPath).catch(() => {});
      }

      // Delete from database
      await media.deleteOne();
      deletedCount++;
    } catch (error) {
      errors.push({
        id: media._id,
        filename: media.filename,
        error: error.message
      });
    }
  }

  res.status(200).json({
    status: 'success',
    message: `${deletedCount} unused media files deleted`,
    data: {
      deleted: deletedCount,
      total: unusedMedia.length,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});
