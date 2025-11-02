/**
 * Media Validators
 * Joi schemas for validating media-related requests
 */

import Joi from 'joi';

export const updateSchema = Joi.object({
  alt: Joi.string()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Alt text cannot exceed 200 characters'
    }),
  caption: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Caption cannot exceed 500 characters'
    })
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
    .default(20),
  type: Joi.string()
    .valid('image', 'video'),
  unused: Joi.boolean()
    .default(false),
  sort: Joi.string()
    .default('-createdAt')
});
