// express
import { Request, Response, NextFunction, Router } from 'express'
// env
import { env } from '@/config/env.js'

// Custom error type definition
interface AppErrorType extends Error {
  statusCode: number
  isOperational: boolean
  stack?: string
}

// Type guard to check if an error is an AppErrorType
const isAppError = (err: unknown): err is AppErrorType => {
  return (
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    'isOperational' in err &&
    err instanceof Error
  )
}

// Error factory function instead of a class
const createAppError = (
  message: string,
  statusCode: number,
  isOperational = true
): AppErrorType => {
  const error = new Error(message) as AppErrorType
  error.statusCode = statusCode
  error.isOperational = isOperational

  // Capture stack trace
  Error.captureStackTrace(error, createAppError)

  return error
}

// Global error handling middleware
const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Default error values
  const error = isAppError(err)
    ? err
    : createAppError(err instanceof Error ? err.message : 'Unexpected error', 500, false)

  // Validate and sanitize statusCode
  let statusCode = error.statusCode
  if (typeof statusCode !== 'number' || isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500
  }

  const message = error.message
  const isOperational = error.isOperational

  // Log error details with timestamp (consider integrating with a proper logging service)
  console.error(
    `[${new Date().toISOString()}] [${req.method} ${req.url}] ERROR ${statusCode} - ${message}`
  )

  if (!isOperational) {
    console.error(`[${new Date().toISOString()}] Non-operational error:`, err)
  }

  // Send error response
  res.status(statusCode).json({
    status: statusCode,
    message,
    // Include stack trace in development but not in production
    ...(env.NODE_ENV === 'development' && {
      error: err instanceof Error ? err.stack : 'Unknown error'
    })
  })
}

// Async error handler wrapper to avoid try/catch blocks in route handlers
const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  if (typeof fn !== 'function') {
    throw new Error('catchAsync requires a function parameter')
  }

  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// Router wrapper that automatically applies catchAsync to all route handlers
const asyncRouter = <T extends Router>(router: T): T => {
  // Store the original route methods
  const methods = ['get', 'post', 'put', 'delete', 'patch']

  // For each HTTP method, override the router method
  methods.forEach(method => {
    // Store the original method before overriding
    type RouterMethod = (path: string, ...handlers: any[]) => T
    const originalMethod = (router as any)[method] as RouterMethod

    // Override the method with our wrapped version
    const r = router as any
    r[method] = (path: string, ...handlers: any[]): T => {
      // Apply catchAsync to each handler that is a function
      const wrappedHandlers = handlers.map(handler =>
        typeof handler === 'function' ? catchAsync(handler) : handler
      )

      // Call the original method with the wrapped handlers
      if (originalMethod) {
        return originalMethod.apply(router, [path, ...wrappedHandlers])
      } else {
        // If no original method exists, just return the router
        return router
      }
    }
  })

  return router
}

// 404 handler for undefined routes
const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const url = req.originalUrl || req.url || 'undefined'
  const err = createAppError(`Not found - ${url}`, 404)
  next(err)
}

export {
  AppErrorType,
  asyncRouter,
  catchAsync,
  createAppError,
  errorHandler,
  isAppError,
  notFoundHandler
}
