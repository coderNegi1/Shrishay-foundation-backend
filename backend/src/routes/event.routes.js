/**
 * Event Routes
 * Handles event-related endpoints
 */

import express from 'express';
import * as eventController from '../controllers/event.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validateRequest, validateQuery } from '../middleware/validateRequest.js';
import * as eventValidator from '../validators/event.validator.js';

const router = express.Router();

// Public routes (with optional auth for better filtering)
router.get('/', 
  optionalAuth,
  validateQuery(eventValidator.querySchema),
  eventController.getEvents
);

router.get('/slug/:slug', 
  eventController.getEventBySlug
);

// Protected routes
router.get('/:id', 
  optionalAuth,
  eventController.getEvent
);

// Admin only routes
router.use(authenticate, authorize('admin')); // All routes below require admin auth

router.post('/', 
  validateRequest(eventValidator.createSchema),
  eventController.createEvent
);

router.patch('/:id', 
  validateRequest(eventValidator.updateSchema),
  eventController.updateEvent
);

router.delete('/:id', 
  eventController.deleteEvent
);

router.post('/:id/restore', 
  eventController.restoreEvent
);

export default router;
