// express
import express from 'express'
// helmet
import helmet from 'helmet'
import type { HelmetOptions } from 'helmet'
// ENV
import { env } from '@/config/env.js'

/**
 * Helmet middleware configuration for API server
 *
 * IMPORTANT: This configuration is specifically tailored for an API-only server.
 * We deliberately separate concerns between Helmet (security headers) and CORS:
 * - Helmet: Handles security headers like HSTS, referrer policy, etc.
 * - CORS: Handled separately by the 'cors' package in cors.ts middleware
 *
 * This separation provides clearer configuration and avoids potential conflicts
 * between the two. Please do not enable Helmet's CORS-related features without
 * coordinating with the CORS configuration in cors.ts middleware.
 */

// Base Helmet middleware with defaults
const helmetMiddleware = express.Router()

// For API-only servers, we use a simplified Helmet configuration
// that excludes browser-specific protections
const helmetOptions: HelmetOptions = {
  // Disable browser-specific protections (unnecessary for API server)
  contentSecurityPolicy: false, // No HTML/JS content to protect
  frameguard: false, // No frames/iframes in API responses
  xssFilter: false, // Modern browsers handle this; not needed for API

  // Let the cors package handle cross-origin settings
  // We disable Helmet's cross-origin policies to avoid conflicts with cors package
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,

  // Keep security headers that are relevant for APIs
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true, // Prevent MIME type sniffing

  // Strict HTTPS enforcement in production
  hsts:
    env.NODE_ENV === 'production'
      ? {
          maxAge: 31536000, // 1 year in seconds
          includeSubDomains: true,
          preload: true
        }
      : false
}

// Apply Helmet with our API-focused configuration
helmetMiddleware.use(helmet(helmetOptions))

export { helmetMiddleware }
