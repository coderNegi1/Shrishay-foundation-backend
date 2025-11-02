/**
 * Authentication Controller
 * Handles user authentication and authorization
 */

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Register a new admin user (protected - only existing admins can create new admins)
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role = 'admin' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    name,
    role
  });

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: { user }
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password +refreshToken');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'Account is deactivated');
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  // Save refresh token to database
  user.lastLogin = new Date();
  await user.save();

  // Set refresh token as httpOnly cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Remove sensitive data
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user,
      accessToken
    }
  });
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token not provided');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Find user and verify stored refresh token
  const user = await User.findById(decoded.id).select('+refreshToken');
  
  if (!user || !user.verifyRefreshToken(refreshToken)) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'Account is deactivated');
  }

  // Generate new tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();
  
  await user.save();

  // Update refresh token cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
  
  res.cookie('refreshToken', newRefreshToken, cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken
    }
  });
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from database
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null
    });
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
});

/**
 * Get current user profile
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
});

/**
 * Update current user profile
 */
export const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Email already in use');
    }
  }

  // Update user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  // Update refresh token cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
  
  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
    data: { accessToken }
  });
});
