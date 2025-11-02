/**
 * Blog Routes
 * Handles blog-related endpoints
 */

import express from 'express';
import * as blogController from '../controllers/blog.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validateRequest, validateQuery } from '../middleware/validateRequest.js';
import * as blogValidator from '../validators/blog.validator.js';

const router = express.Router();

// Public routes (with optional auth for better filtering)
router.get('/', 
  optionalAuth,
  validateQuery(blogValidator.querySchema),
  blogController.getBlogs
);

router.get('/categories', 
  blogController.getCategories
);

router.get('/slug/:slug', 
  blogController.getBlogBySlug
);

// Protected routes
router.get('/:id', 
  optionalAuth,
  blogController.getBlog
);

// Admin only routes
router.use(authenticate, authorize('admin')); // All routes below require admin auth

router.post('/', 
  validateRequest(blogValidator.createSchema),
  blogController.createBlog
);

router.patch('/:id', 
  validateRequest(blogValidator.updateSchema),
  blogController.updateBlog
);

router.delete('/:id', 
  blogController.deleteBlog
);

router.post('/:id/restore', 
  blogController.restoreBlog
);

export default router;
