/**
 * Firebase Authentication Token Verification Middleware
 *
 * This middleware validates Firebase Auth tokens passed in the Authorization header.
 * It extracts the user ID and other claims from the token and attaches them to the request object.
 * Protected routes should use this middleware to ensure only authenticated users can access them.
 */

import { Request, Response, NextFunction } from 'express'
import { auth } from '@/config/firebase.js'
import { createAppError } from '@/middleware/error/errorHandler.js'
import { env } from '@/config/env.js'

// Import Firebase Auth types
import type { DecodedIdToken } from 'firebase-admin/auth'

// Extend Express Request to include user information using module augmentation
// This avoids the @typescript-eslint/no-namespace warning
import 'express'

// Define a type for our user that extends DecodedIdToken but with explicit role handling
type UserWithRole = DecodedIdToken & {
  // Make role explicitly optional
  role?: string
}

declare module 'express' {
  interface Request {
    user?: UserWithRole
  }
}

/**
 * Middleware to verify Firebase authentication tokens
 *
 * Usage:
 * - Apply to routes that require authentication
 * - Can be applied globally or to specific routes
 *
 * Example:
 * ```
 * // Protect a single route
 * router.get('/protected', verifyToken, (req, res) => {
 *   // Access user info via req.user
 *   res.json({ message: `Hello ${req.user?.email}` })
 * })
 *
 * // Or protect all routes in a router
 * router.use(verifyToken)
 * ```
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    // Check if Authorization header exists
    if (!authHeader) {
      return next(createAppError('No authorization token provided', 401))
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return next(createAppError('Invalid authorization format. Use Bearer token', 401))
    }

    // Extract the token
    const token = authHeader.split(' ')[1]

    // Verify the token with Firebase Auth
    const decodedToken = await auth.verifyIdToken(token)

    // Attach user information to the request object
    // Since we're using the DecodedIdToken type, we can assign it directly
    // with our explicit role handling
    req.user = {
      ...decodedToken,
      // role is undefined by default unless manually assigned using Firebase Admin SDK
      role: decodedToken?.role
    }

    // Continue to the next middleware or route handler
    next()
  } catch (error) {
    // Handle different types of Firebase Auth errors
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        return next(createAppError('Token expired. Please sign in again', 401))
      }
      if (error.message.includes('auth/id-token-revoked')) {
        return next(createAppError('Token has been revoked. Please sign in again', 401))
      }
      if (error.message.includes('auth/invalid-id-token')) {
        return next(createAppError('Invalid token. Please sign in again', 401))
      }
    }

    // Log invalid tokens in development mode
    if (env.NODE_ENV !== 'production' && error instanceof Error) {
      console.warn(`[Auth] Invalid token Path: ${req.path} | Error: ${error.message}`)
    }

    // Generic auth error
    next(createAppError('Failed to authenticate user', 401))
  }
}

/**
 * Middleware to restrict access based on user roles
 * Must be used after verifyToken middleware
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 *
 * Example:
 * ```
 * // Only allow admins and developers to access this route
 * router.get('/admin', verifyToken, requireRole(['admin', 'developer']), handler)
 * ```
 */
export const requireRole =
  (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    // Add developer role to allowed roles on all routes
    const normalizedRoles = [...allowedRoles.map(r => r.toLowerCase()), 'developer']

    const userRole = req?.user?.role?.toLowerCase() || ''

    // User has no role set
    if (!userRole) console.warn(`[Auth] User ${req.user?.email || req.user?.uid} has no role set`)
    // User does not have permission to access the route
    if (!normalizedRoles.includes(userRole)) {
      console.warn(`[Auth] Access denied: role=${userRole}, path=${req.path}`)
      return next(createAppError('Forbidden: insufficient permissions', 403))
    }

    // User has permission to access the route
    next()
  }
