/**
 * Blog Controller
 * Handles CRUD operations for blog posts
 */

import Blog from '../models/Blog.js';
import Media from '../models/Media.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all blogs with pagination and filters
 */
export const getBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = 'published',
    category,
    featured,
    search,
    tags,
    sort = '-publishedAt'
  } = req.query;

  // Build query
  const query = {};
  
  // Status filter (for admin, show all; for public, only published)
  if (req.user?.role === 'admin' && status !== 'all') {
    query.status = status;
  } else if (!req.user || req.user.role !== 'admin') {
    query.status = 'published';
  }

  // Category filter
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }

  // Featured filter
  if (featured !== undefined) {
    query.isFeatured = featured === 'true';
  }

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .populate('heroImage')
      .populate('gallery')
      .populate('video')
      .populate('author', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Blog.countDocuments(query)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      blogs,
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
 * Get single blog by ID
 */
export const getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)
    .populate('heroImage')
    .populate('gallery')
    .populate('video')
    .populate('author', 'name email')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }

  // Check if user can view draft/archived blogs
  if (blog.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
    throw new ApiError(403, 'Access denied');
  }

  // Increment views for published blogs
  if (blog.status === 'published') {
    blog.views += 1;
    await blog.save();
  }

  res.status(200).json({
    status: 'success',
    data: { blog }
  });
});

/**
 * Get blog by slug (for public pages)
 */
export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ 
    slug: req.params.slug,
    status: 'published'
  })
    .populate('heroImage')
    .populate('gallery')
    .populate('video')
    .populate('author', 'name email');

  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }

  // Increment views
  blog.views += 1;
  await blog.save();

  res.status(200).json({
    status: 'success',
    data: { blog }
  });
});

/**
 * Get all blog categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.distinct('category', { 
    status: 'published' 
  });

  res.status(200).json({
    status: 'success',
    data: { categories }
  });
});

/**
 * Create new blog (admin only)
 */
export const createBlog = asyncHandler(async (req, res) => {
  const blogData = {
    ...req.body,
    author: req.user._id,
    createdBy: req.user._id,
    updatedBy: req.user._id
  };

  // Validate required hero image
  if (!blogData.heroImage) {
    throw new ApiError(400, 'Hero image is required');
  }

  // Create blog
  const blog = await Blog.create(blogData);

  // Update media usage
  if (blog.heroImage) {
    await Media.findByIdAndUpdate(blog.heroImage, {
      $push: {
        usedIn: {
          model: 'Blog',
          modelId: blog._id,
          field: 'heroImage'
        }
      }
    });
  }

  if (blog.gallery && blog.gallery.length > 0) {
    await Media.updateMany(
      { _id: { $in: blog.gallery } },
      {
        $push: {
          usedIn: {
            model: 'Blog',
            modelId: blog._id,
            field: 'gallery'
          }
        }
      }
    );
  }

  if (blog.video) {
    await Media.findByIdAndUpdate(blog.video, {
      $push: {
        usedIn: {
          model: 'Blog',
          modelId: blog._id,
          field: 'video'
        }
      }
    });
  }

  // Populate fields before sending response
  await blog.populate(['heroImage', 'gallery', 'video', 'author']);

  res.status(201).json({
    status: 'success',
    message: 'Blog created successfully',
    data: { blog }
  });
});

/**
 * Update blog (admin only)
 */
export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }

  // Store old media IDs for cleanup
  const oldHeroImage = blog.heroImage;
  const oldGallery = blog.gallery || [];
  const oldVideo = blog.video;

  // Update blog
  Object.assign(blog, {
    ...req.body,
    updatedBy: req.user._id
  });

  await blog.save();

  // Update media usage references
  // Hero image
  if (oldHeroImage && oldHeroImage.toString() !== blog.heroImage?.toString()) {
    await Media.findByIdAndUpdate(oldHeroImage, {
      $pull: {
        usedIn: {
          model: 'Blog',
          modelId: blog._id,
          field: 'heroImage'
        }
      }
    });
  }

  if (blog.heroImage && oldHeroImage?.toString() !== blog.heroImage.toString()) {
    await Media.findByIdAndUpdate(blog.heroImage, {
      $push: {
        usedIn: {
          model: 'Blog',
          modelId: blog._id,
          field: 'heroImage'
        }
      }
    });
  }

  // Gallery
  const newGallery = blog.gallery || [];
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
            model: 'Blog',
            modelId: blog._id,
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
            model: 'Blog',
            modelId: blog._id,
            field: 'gallery'
          }
        }
      }
    );
  }

  // Video
  if (oldVideo && oldVideo.toString() !== blog.video?.toString()) {
    await Media.findByIdAndUpdate(oldVideo, {
      $pull: {
        usedIn: {
          model: 'Blog',
          modelId: blog._id,
          field: 'video'
        }
      }
    });
  }

  if (blog.video && oldVideo?.toString() !== blog.video?.toString()) {
    await Media.findByIdAndUpdate(blog.video, {
      $push: {
        usedIn: {
          model: 'Blog',
          modelId: blog._id,
          field: 'video'
        }
      }
    });
  }

  // Populate and return updated blog
  await blog.populate(['heroImage', 'gallery', 'video', 'author']);

  res.status(200).json({
    status: 'success',
    message: 'Blog updated successfully',
    data: { blog }
  });
});

/**
 * Delete blog (admin only - soft delete)
 */
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }

  // Soft delete
  await blog.softDelete();

  // Remove media usage references
  const mediaIds = [blog.heroImage, blog.video, ...(blog.gallery || [])].filter(Boolean);
  
  if (mediaIds.length > 0) {
    await Media.updateMany(
      { _id: { $in: mediaIds } },
      {
        $pull: {
          usedIn: {
            model: 'Blog',
            modelId: blog._id
          }
        }
      }
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Blog deleted successfully'
  });
});

/**
 * Restore deleted blog (admin only)
 */
export const restoreBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).setOptions({ includeDeleted: true });

  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }

  if (!blog.isDeleted) {
    throw new ApiError(400, 'Blog is not deleted');
  }

  // Restore blog
  await blog.restore();

  // Restore media usage references
  const mediaUpdates = [];
  
  if (blog.heroImage) {
    mediaUpdates.push(
      Media.findByIdAndUpdate(blog.heroImage, {
        $push: {
          usedIn: {
            model: 'Blog',
            modelId: blog._id,
            field: 'heroImage'
          }
        }
      })
    );
  }

  if (blog.gallery && blog.gallery.length > 0) {
    mediaUpdates.push(
      Media.updateMany(
        { _id: { $in: blog.gallery } },
        {
          $push: {
            usedIn: {
              model: 'Blog',
              modelId: blog._id,
              field: 'gallery'
            }
          }
        }
      )
    );
  }

  if (blog.video) {
    mediaUpdates.push(
      Media.findByIdAndUpdate(blog.video, {
        $push: {
          usedIn: {
            model: 'Blog',
            modelId: blog._id,
            field: 'video'
          }
        }
      })
    );
  }

  await Promise.all(mediaUpdates);
  await blog.populate(['heroImage', 'gallery', 'video', 'author']);

  res.status(200).json({
    status: 'success',
    message: 'Blog restored successfully',
    data: { blog }
  });
});
