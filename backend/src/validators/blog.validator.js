/**
 * Blog Validators
 * Joi schemas for validating blog-related requests
 */

import Joi from 'joi';

export const createSchema = Joi.object({
  title: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  excerpt: Joi.string()
    .max(500)
    .required()
    .messages({
      'string.max': 'Excerpt cannot exceed 500 characters',
      'any.required': 'Excerpt is required'
    }),
  content: Joi.string()
    .required()
    .messages({
      'any.required': 'Content is required'
    }),
  category: Joi.string()
    .required()
    .messages({
      'any.required': 'Category is required'
    }),
  isFeatured: Joi.boolean()
    .default(false),
  status: Joi.string()
    .valid('draft', 'published', 'archived')
    .default('draft'),
  heroImage: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Invalid hero image ID',
      'string.length': 'Invalid hero image ID',
      'any.required': 'Hero image is required'
    }),
  gallery: Joi.array()
    .items(
      Joi.string().hex().length(24)
    )
    .messages({
      'array.base': 'Gallery must be an array of image IDs'
    }),
  video: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .messages({
      'string.hex': 'Invalid video ID',
      'string.length': 'Invalid video ID'
    }),
  videoUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Video URL must be a valid URL'
    }),
  seoTitle: Joi.string()
    .max(70)
    .messages({
      'string.max': 'SEO title cannot exceed 70 characters'
    }),
  seoDescription: Joi.string()
    .max(160)
    .messages({
      'string.max': 'SEO description cannot exceed 160 characters'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().lowercase())
});

export const updateSchema = Joi.object({
  title: Joi.string()
    .max(200)
    .messages({
      'string.max': 'Title cannot exceed 200 characters'
    }),
  excerpt: Joi.string()
    .max(500)
    .messages({
      'string.max': 'Excerpt cannot exceed 500 characters'
    }),
  content: Joi.string(),
  category: Joi.string(),
  isFeatured: Joi.boolean(),
  status: Joi.string()
    .valid('draft', 'published', 'archived'),
  heroImage: Joi.string()
    .hex()
    .length(24)
    .messages({
      'string.hex': 'Invalid hero image ID',
      'string.length': 'Invalid hero image ID'
    }),
  gallery: Joi.array()
    .items(
      Joi.string().hex().length(24)
    )
    .messages({
      'array.base': 'Gallery must be an array of image IDs'
    }),
  video: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .messages({
      'string.hex': 'Invalid video ID',
      'string.length': 'Invalid video ID'
    }),
  videoUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Video URL must be a valid URL'
    }),
  seoTitle: Joi.string()
    .max(70)
    .allow('')
    .messages({
      'string.max': 'SEO title cannot exceed 70 characters'
    }),
  seoDescription: Joi.string()
    .max(160)
    .allow('')
    .messages({
      'string.max': 'SEO description cannot exceed 160 characters'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().lowercase())
}).min(1);

export const querySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  status: Joi.string()
    .valid('all', 'draft', 'published', 'archived')
    .default('published'),
  category: Joi.string()
    .trim(),
  featured: Joi.boolean(),
  search: Joi.string()
    .trim(),
  tags: Joi.string()
    .trim(),
  sort: Joi.string()
    .default('-publishedAt')
});
