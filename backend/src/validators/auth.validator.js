/**
 * Authentication Validators
 * Joi schemas for validating auth-related requests
 */

import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  name: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  role: Joi.string()
    .valid('admin', 'editor')
    .default('admin')
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const updateProfileSchema = Joi.object({
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  name: Joi.string()
    .max(50)
    .messages({
      'string.max': 'Name cannot exceed 50 characters'
    })
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
});
