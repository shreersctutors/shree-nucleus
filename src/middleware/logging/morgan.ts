// express
import { Request } from 'express'
// morgan
import morgan from 'morgan'
// fs
import fs from 'fs'
// path
import path from 'path'
// env
import { env } from '@/config/env.js'

// Custom token for request body (limited to prevent logging sensitive data)
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Limit body size and remove sensitive fields
    const sanitizedBody = { ...req.body }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]'
      }
    })

    return JSON.stringify(sanitizedBody).substring(0, 300) // Limit size
  }
  return ''
})

// Define different log formats based on environment
// Only include body token in development to avoid GDPR issues in production
const bodyToken = env.NODE_ENV === 'production' ? '' : ' - :body'
const developmentFormat = `:method :url :status :response-time ms${bodyToken}`
const productionFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'

// For local file logging (if needed)
// Ensure logs directory exists before writing
const setupLocalLogs = () => {
  const logDir = path.join(process.cwd(), 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  return fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' })
}

// Configure Morgan middleware based on environment
// In production, log to stdout for Elastic Beanstalk/CloudWatch integration
const morganMiddleware =
  env.NODE_ENV === 'production'
    ? morgan(productionFormat) // Log to stdout for CloudWatch
    : morgan(developmentFormat, {
        skip: (req: Request) => {
          // Skip logging for health check endpoints in development
          return req.url.includes('/health') || req.url.includes('/favicon.ico')
        }
      })

export { morganMiddleware }
