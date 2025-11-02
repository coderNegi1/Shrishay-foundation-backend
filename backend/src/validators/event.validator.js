/**
 * Event Validators
 * Joi schemas for validating event-related requests
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
  description: Joi.string()
    .max(5000)
    .required()
    .messages({
      'string.max': 'Description cannot exceed 5000 characters',
      'any.required': 'Description is required'
    }),
  time: Joi.string()
    .required()
    .messages({
      'any.required': 'Event time is required'
    }),
  location: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.max': 'Location cannot exceed 200 characters',
      'any.required': 'Location is required'
    }),
  datetime: Joi.date()
    .required()
    .messages({
      'any.required': 'Event date is required'
    }),
  type: Joi.string()
    .valid('featured', 'normal')
    .default('normal'),
  status: Joi.string()
    .valid('draft', 'published', 'archived')
    .default('draft'),
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
  description: Joi.string()
    .max(5000)
    .messages({
      'string.max': 'Description cannot exceed 5000 characters'
    }),
  time: Joi.string(),
  location: Joi.string()
    .max(200)
    .messages({
      'string.max': 'Location cannot exceed 200 characters'
    }),
  datetime: Joi.date(),
  type: Joi.string()
    .valid('featured', 'normal'),
  status: Joi.string()
    .valid('draft', 'published', 'archived'),
  heroImage: Joi.string()
    .hex()
    .length(24)
    .allow(null)
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
  type: Joi.string()
    .valid('featured', 'normal'),
  search: Joi.string()
    .trim(),
  tags: Joi.string()
    .trim(),
  from: Joi.date(),
  to: Joi.date(),
  sort: Joi.string()
    .default('-datetime')
});
