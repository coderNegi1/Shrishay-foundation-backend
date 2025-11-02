/**
 * Media Routes
 * Handles media upload and management endpoints
 */

import express from 'express';
import * as mediaController from '../controllers/media.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMiddleware } from '../config/multer.js';
import { validateRequest, validateQuery } from '../middleware/validateRequest.js';
import * as mediaValidator from '../validators/media.validator.js';

const router = express.Router();

// All media routes require admin authentication
router.use(authenticate, authorize('admin'));

// Upload routes
router.post('/upload', 
  uploadMiddleware.multiple('files', 10),
  mediaController.uploadFiles
);

// Media management routes
router.get('/', 
  validateQuery(mediaValidator.querySchema),
  mediaController.getMedia
);

router.get('/:id', 
  mediaController.getMediaById
);

router.patch('/:id', 
  validateRequest(mediaValidator.updateSchema),
  mediaController.updateMedia
);

router.delete('/:id', 
  mediaController.deleteMedia
);

// Bulk operations
router.delete('/bulk/unused', 
  mediaController.deleteUnusedMedia
);

export default router;
