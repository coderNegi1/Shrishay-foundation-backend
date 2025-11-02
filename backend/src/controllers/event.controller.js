/**
 * Event Controller
 * Handles CRUD operations for events
 */

import Event from '../models/Event.js';
import Media from '../models/Media.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all events with pagination and filters
 */
export const getEvents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = 'published',
    type,
    search,
    tags,
    from,
    to,
    sort = '-datetime'
  } = req.query;

  // Build query
  const query = {};
  
  // Status filter (for admin, show all; for public, only published)
  if (req.user?.role === 'admin' && status !== 'all') {
    query.status = status;
  } else if (!req.user || req.user.role !== 'admin') {
    query.status = 'published';
  }

  // Type filter
  if (type) {
    query.type = type;
  }

  // Date range filter
  if (from || to) {
    query.datetime = {};
    if (from) query.datetime.$gte = new Date(from);
    if (to) query.datetime.$lte = new Date(to);
  }

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [events, total] = await Promise.all([
    Event.find(query)
      .populate('heroImage')
      .populate('gallery')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Event.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      events,
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
 * Get single event by ID
 */
export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('heroImage')
    .populate('gallery')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Check if user can view draft/archived events
  if (event.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
    throw new ApiError(403, 'Access denied');
  }

  // Increment views for published events
  if (event.status === 'published') {
    event.views += 1;
    await event.save();
  }

  res.status(200).json({
    status: 'success',
    data: { event }
  });
});

/**
 * Get event by slug (for public pages)
 */
export const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ 
    slug: req.params.slug,
    status: 'published'
  })
    .populate('heroImage')
    .populate('gallery');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Increment views
  event.views += 1;
  await event.save();

  res.status(200).json({
    status: 'success',
    data: { event }
  });
});

/**
 * Create new event (admin only)
 */
export const createEvent = asyncHandler(async (req, res) => {
  const eventData = {
    ...req.body,
    createdBy: req.user._id,
    updatedBy: req.user._id
  };

  // Create event
  const event = await Event.create(eventData);

  // Update media usage if media files are attached
  if (event.heroImage) {
    await Media.findByIdAndUpdate(event.heroImage, {
      $push: {
        usedIn: {
          model: 'Event',
          modelId: event._id,
          field: 'heroImage'
        }
      }
    });
  }

  if (event.gallery && event.gallery.length > 0) {
    await Media.updateMany(
      { _id: { $in: event.gallery } },
      {
        $push: {
          usedIn: {
            model: 'Event',
            modelId: event._id,
            field: 'gallery'
          }
        }
      }
    );
  }

  // Populate media fields before sending response
  await event.populate(['heroImage', 'gallery']);

  res.status(201).json({
    status: 'success',
    message: 'Event created successfully',
    data: { event }
  });
});

/**
 * Update event (admin only)
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Store old media IDs for cleanup
  const oldHeroImage = event.heroImage;
  const oldGallery = event.gallery || [];

  // Update event
  Object.assign(event, {
    ...req.body,
    updatedBy: req.user._id
  });

  await event.save();

  // Update media usage references
  // Remove old hero image reference if changed
  if (oldHeroImage && oldHeroImage.toString() !== event.heroImage?.toString()) {
    await Media.findByIdAndUpdate(oldHeroImage, {
      $pull: {
        usedIn: {
          model: 'Event',
          modelId: event._id,
          field: 'heroImage'
        }
      }
    });
  }

  // Add new hero image reference
  if (event.heroImage && oldHeroImage?.toString() !== event.heroImage.toString()) {
    await Media.findByIdAndUpdate(event.heroImage, {
      $push: {
        usedIn: {
          model: 'Event',
          modelId: event._id,
          field: 'heroImage'
        }
      }
    });
  }

  // Update gallery references
  const newGallery = event.gallery || [];
  const removedImages = oldGallery.filter(id => 
    !newGallery.some(newId => newId.toString() === id.toString())
  );
  const addedImages = newGallery.filter(id => 
    !oldGallery.some(oldId => oldId.toString() === id.toString())
  );

  if (removedImages.length > 0) {
    await Media.updateMany(
      { _id: { $in: removedImages } },
      {
        $pull: {
          usedIn: {
            model: 'Event',
            modelId: event._id,
            field: 'gallery'
          }
        }
      }
    );
  }

  if (addedImages.length > 0) {
    await Media.updateMany(
      { _id: { $in: addedImages } },
      {
        $push: {
          usedIn: {
            model: 'Event',
            modelId: event._id,
            field: 'gallery'
          }
        }
      }
    );
  }

  // Populate and return updated event
  await event.populate(['heroImage', 'gallery']);

  res.status(200).json({
    status: 'success',
    message: 'Event updated successfully',
    data: { event }
  });
});

/**
 * Delete event (admin only - soft delete)
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Soft delete
  await event.softDelete();

  // Remove media usage references
  const mediaIds = [event.heroImage, ...(event.gallery || [])].filter(Boolean);
  
  if (mediaIds.length > 0) {
    await Media.updateMany(
      { _id: { $in: mediaIds } },
      {
        $pull: {
          usedIn: {
            model: 'Event',
            modelId: event._id
          }
        }
      }
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully'
  });
});

/**
 * Restore deleted event (admin only)
 */
export const restoreEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).setOptions({ includeDeleted: true });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (!event.isDeleted) {
    throw new ApiError(400, 'Event is not deleted');
  }

  // Restore event
  await event.restore();

  // Restore media usage references
  if (event.heroImage) {
    await Media.findByIdAndUpdate(event.heroImage, {
      $push: {
        usedIn: {
          model: 'Event',
          modelId: event._id,
          field: 'heroImage'
        }
      }
    });
  }

  if (event.gallery && event.gallery.length > 0) {
    await Media.updateMany(
      { _id: { $in: event.gallery } },
      {
        $push: {
          usedIn: {
            model: 'Event',
            modelId: event._id,
            field: 'gallery'
          }
        }
      }
    );
  }

  await event.populate(['heroImage', 'gallery']);

  res.status(200).json({
    status: 'success',
    message: 'Event restored successfully',
    data: { event }
  });
});
