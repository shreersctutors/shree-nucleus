// Express configuration
import express from 'express'
// middlewares
import {
  corsMiddleware,
  helmetMiddleware,
  morganMiddleware,
  errorHandler,
  notFoundHandler
} from '@/middleware/index.js'

// Import routes
import docsRoutes from '@/api/docs/docs.route.js'
import authRoutes from '@/api/auth/auth.route.js'

/**
 * Attention: Load environment variables from config/env.js file
 */

// App configuration
const app = express()

// Middleware
app.use(corsMiddleware) // CORS must be applied before other middleware
app.use(helmetMiddleware) // Helmet for security headers
app.use(express.json()) // Express middleware
app.use(morganMiddleware) // Morgan for logging

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ status: 200, message: 'Shree Nucleus API is running!' })
})

// Health check endpoint for monitoring and load balancers
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API route modules
app.use('/docs', docsRoutes)
app.use('/auth', authRoutes)

// Error handlers
app.use(errorHandler) // Catch errors globally instead of try/catch blocks in route handlers
app.use(notFoundHandler) // Handle 404 routes
export default app
