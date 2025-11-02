/**
 * Blog Model
 * Defines the schema for blog posts with media support
 */

import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  excerpt: {
    type: String,
    required: [true, 'Blog excerpt is required'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Blog content is required']
  },
  category: {
    type: String,
    required: [true, 'Blog category is required'],
    trim: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Media fields
  heroImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: [true, 'Hero image is required']
  },
  gallery: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  }],
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  },
  videoUrl: String, // For external video URLs (YouTube, etc.)
  
  // SEO fields
  seoTitle: {
    type: String,
    maxlength: [70, 'SEO title cannot exceed 70 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Author and tracking
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: Date,
  readTime: Number, // Reading time in minutes
  views: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ isFeatured: 1, status: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ isDeleted: 1 });

// Generate slug before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g 
    });
    
    // Add timestamp to ensure uniqueness
    this.slug = `${this.slug}-${Date.now()}`;
  }
  
  // Calculate read time based on content length (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  if (!this.publishedAt) return null;
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return this.publishedAt.toLocaleDateString('en-US', options);
});

// Soft delete method
blogSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
blogSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Default query to exclude soft deleted items
blogSchema.pre(/^find/, function() {
  // Only apply if not explicitly looking for deleted items
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
});

// Include virtuals in JSON output
blogSchema.set('toJSON', { virtuals: true });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
