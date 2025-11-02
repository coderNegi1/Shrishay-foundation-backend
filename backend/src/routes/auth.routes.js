/**
 * Authentication Routes
 * Handles user authentication endpoints
 */

import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as authValidator from '../validators/auth.validator.js';

const router = express.Router();

// Public routes
router.post('/login', 
  validateRequest(authValidator.loginSchema),
  authController.login
);

router.post('/refresh-token', 
  authController.refreshToken
);

router.post('/logout', 
  authController.logout
);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.get('/me', 
  authController.getMe
);

router.patch('/me', 
  validateRequest(authValidator.updateProfileSchema),
  authController.updateMe
);

router.patch('/change-password', 
  validateRequest(authValidator.changePasswordSchema),
  authController.changePassword
);

// Admin only routes
router.post('/register', 
  authorize('admin'),
  validateRequest(authValidator.registerSchema),
  authController.register
);

export default router;
