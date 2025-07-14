// Main application entry point
// Server initialization and process event handling
import http from 'http'
// Import Express app from app.ts
import app from '@/app.js'
// env
import { env } from '@/config/env.js'

/**
 * Load environment variables from config/env.js file
 */

const port = env.PORT || 3000

// Create HTTP server
const server = http.createServer(app)

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    // Additional cleanup if needed (e.g., database connections)
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    // Additional cleanup if needed
    process.exit(0)
  })
})

// Handle unhandled promise rejections
process.on('unhandledRejection', reason => {
  console.error('Unhandled rejection:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err)
  server.close(() => process.exit(1))
})

export default server
