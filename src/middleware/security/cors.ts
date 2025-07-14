/**
 * CORS Middleware Configuration
 *
 * Configures Cross-Origin Resource Sharing (CORS) policy for the API.
 * This allows controlled access from specified frontend domains and
 * prevents unauthorized cross-origin requests.
 */

import cors from 'cors'
import { CorsOptions } from 'cors'

/**
 * CORS configuration options
 * - Allows requests from specified frontend domains and Amplify preview environments
 * - Supports credentials (cookies, authorization headers)
 * - Exposes Content-Disposition header for file downloads
 */
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      callback(null, true)
      return
    }

    // Specific allowed domains
    const allowedOrigins = new Set(['http://localhost:3000'])

    // Check for exact matches first
    if (allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    // Reject all other origins
    console.warn(`[CORS] Blocked origin: ${origin}`)
    callback(new Error(`Origin ${origin} not allowed by CORS policy`), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'], // Make Content-Disposition header accessible to browsers
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 86400 // Cache preflight requests for 24 hours
}

/**
 * CORS middleware
 * Must be applied before other middleware in app.ts
 */
export const corsMiddleware = cors(corsOptions)
