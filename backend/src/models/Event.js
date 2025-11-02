/**
 * Event Model
 * Defines the schema for events with media support
 */

import mongoose from 'mongoose';
import slugify from 'slugify';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  time: {
    type: String,
    required: [true, 'Event time is required'],
    // Format: "8:00 am - 12:30 pm"
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  datetime: {
    type: Date,
    required: [true, 'Event date is required'],
    index: true
  },
  // For UI display - will be auto-generated from datetime
  dateDay: String, // e.g., "15th"
  dateMonth: String, // e.g., "AUG"
  
  type: {
    type: String,
    enum: ['featured', 'normal'],
    default: 'normal'
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
    ref: 'Media'
  },
  gallery: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  }],
  
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
  
  // Tracking fields
  publishedAt: Date,
  views: {
    type: Number,
    default: 0
  },
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
eventSchema.index({ status: 1, datetime: -1 });
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ isDeleted: 1 });

// Generate slug before saving
eventSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g 
    });
    
    // Add timestamp to ensure uniqueness
    this.slug = `${this.slug}-${Date.now()}`;
  }
  
  // Generate date display fields from datetime
  if (this.isModified('datetime')) {
    const date = new Date(this.datetime);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    
    // Add ordinal suffix to day
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    this.dateDay = day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
    this.dateMonth = month;
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Soft delete method
eventSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
eventSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Default query to exclude soft deleted items
eventSchema.pre(/^find/, function() {
  // Only apply if not explicitly looking for deleted items
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
