/**
 * Media Model
 * Defines the schema for uploaded media files (images and videos)
 */

import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  duration: Number, // For videos, in seconds
  thumbnail: String, // Thumbnail URL for videos
  
  // Metadata
  alt: String, // Alt text for accessibility
  caption: String,
  
  // Relations
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Usage tracking
  usedIn: [{
    model: {
      type: String,
      enum: ['Event', 'Blog']
    },
    modelId: mongoose.Schema.Types.ObjectId,
    field: String // Which field it's used in (heroImage, gallery, etc.)
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
mediaSchema.index({ type: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ isDeleted: 1 });
mediaSchema.index({ 'usedIn.model': 1, 'usedIn.modelId': 1 });

// Virtual for checking if media is in use
mediaSchema.virtual('isInUse').get(function() {
  return this.usedIn && this.usedIn.length > 0;
});

// Method to add usage reference
mediaSchema.methods.addUsage = function(model, modelId, field) {
  const usage = { model, modelId, field };
  
  // Check if this usage already exists
  const exists = this.usedIn.some(u => 
    u.model === model && 
    u.modelId.toString() === modelId.toString() && 
    u.field === field
  );
  
  if (!exists) {
    this.usedIn.push(usage);
  }
  
  return this.save();
};

// Method to remove usage reference
mediaSchema.methods.removeUsage = function(model, modelId, field) {
  this.usedIn = this.usedIn.filter(u => !(
    u.model === model && 
    u.modelId.toString() === modelId.toString() && 
    u.field === field
  ));
  
  return this.save();
};

// Soft delete method
mediaSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
mediaSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Default query to exclude soft deleted items
mediaSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
});

// Include virtuals in JSON output
mediaSchema.set('toJSON', { virtuals: true });

const Media = mongoose.model('Media', mediaSchema);

export default Media;
