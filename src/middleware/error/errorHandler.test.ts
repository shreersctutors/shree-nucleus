import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
}

// Mock env module
vi.mock('@/config/env.js', () => ({
  env: { NODE_ENV: 'test' }
}))

// Import after mocking
import {
  createAppError,
  isAppError,
  errorHandler,
  catchAsync,
  asyncRouter,
  notFoundHandler
} from './errorHandler.js'

describe('Error Handler', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test'
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
    mockNext = vi.fn()
    vi.clearAllMocks()
  })

  describe('createAppError', () => {
    it('should create an AppError with default operational flag', () => {
      const error = createAppError('Test error', 400)

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.stack).toBeDefined()
    })

    it('should create an AppError with custom operational flag', () => {
      const error = createAppError('Test error', 500, false)

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(false)
    })

    it('should handle empty or null message', () => {
      const error = createAppError('', 400)
      expect(error.message).toBe('')
      expect(error.statusCode).toBe(400)
    })

    it('should handle invalid statusCode', () => {
      const error = createAppError('Invalid', NaN)
      expect(error.message).toBe('Invalid')
      expect(error.statusCode).toBeNaN()
    })

    it('should handle undefined statusCode', () => {
      const error = createAppError('Test', undefined as any)
      expect(error.message).toBe('Test')
      expect(error.statusCode).toBeUndefined()
    })
  })

  describe('isAppError', () => {
    it('should return true for valid AppError', () => {
      const error = createAppError('Test error', 400)
      expect(isAppError(error)).toBe(true)
    })

    it('should return false for regular Error', () => {
      const error = new Error('Test error')
      expect(isAppError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAppError(null)).toBe(false)
    })

    it('should return false for string', () => {
      expect(isAppError('test')).toBe(false)
    })

    it('should return false for object without required properties', () => {
      const error = { message: 'test' }
      expect(isAppError(error)).toBe(false)
    })

    it('should return false for object that mimics AppError structure but not instance', () => {
      const fakeAppError = {
        message: 'I am fake',
        statusCode: 500,
        isOperational: true
      }
      expect(isAppError(fakeAppError)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAppError(undefined)).toBe(false)
    })

    it('should return false for number', () => {
      expect(isAppError(42)).toBe(false)
    })

    it('should return false for boolean', () => {
      expect(isAppError(true)).toBe(false)
    })
  })

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = createAppError('Test error', 400)

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(consoleSpy.error).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: 'Test error'
      })
    })

    it('should handle regular Error and convert to AppError', () => {
      const error = new Error('Regular error')

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(consoleSpy.error).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Regular error'
      })
    })

    it('should handle non-Error objects', () => {
      const error = 'String error'

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Unexpected error'
      })
    })

    it('should handle errors with non-enumerable statusCode property', () => {
      const error = Object.create(new Error('Hidden props'))
      error.statusCode = 500
      Object.defineProperty(error, 'statusCode', { enumerable: false })

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Hidden props'
      })
    })

    it('should handle circular error objects without crashing', () => {
      const error = new Error('circular')
      ;(error as any).self = error // Create circular reference

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'circular'
      })
    })

    it('should handle custom errors that extend Error but miss properties', () => {
      class WeirdError extends Error {}
      const error = new WeirdError('no statusCode')

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'no statusCode'
      })
    })

    it('should handle null error', () => {
      errorHandler(null as any, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Unexpected error'
      })
    })

    it('should handle undefined error', () => {
      errorHandler(undefined as any, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Unexpected error'
      })
    })

    it('should handle error with undefined statusCode', () => {
      const error = createAppError('Test', undefined as any)
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Test'
      })
    })

    it('should handle error with NaN statusCode', () => {
      const error = createAppError('Test', NaN)
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Test'
      })
    })
  })

  describe('catchAsync', () => {
    it('should call the async function and pass result to next', async () => {
      const asyncHandler = vi.fn().mockResolvedValue('success')
      const wrappedHandler = catchAsync(asyncHandler)

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext)

      expect(asyncHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should catch errors and pass them to next', async () => {
      const error = new Error('Async error')
      const asyncHandler = vi.fn().mockRejectedValue(error)
      const wrappedHandler = catchAsync(asyncHandler)

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })

    it('should handle sync errors thrown by handler', () => {
      const handler = () => {
        throw new Error('sync throw')
      }
      const wrapped = catchAsync(handler)

      expect(() => wrapped(mockReq as Request, mockRes as Response, mockNext)).toThrow('sync throw')
    })

    it('should handle non-function input gracefully', () => {
      const nonFunction = 'not a function' as any

      expect(() => catchAsync(nonFunction)).toThrow()
    })

    it('should preserve function context and arguments', async () => {
      const asyncHandler = vi.fn().mockResolvedValue('success')
      const wrappedHandler = catchAsync(asyncHandler)

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext)

      expect(asyncHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext)
    })
  })

  describe('notFoundHandler', () => {
    it('should create 404 error and pass to next', () => {
      notFoundHandler(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found - /test',
          statusCode: 404
        })
      )
    })

    it('should handle missing originalUrl', () => {
      const req = { method: 'GET', url: '/x' } as any
      notFoundHandler(req, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found - /x',
          statusCode: 404
        })
      )
    })

    it('should handle missing url property', () => {
      const req = { method: 'GET' } as any
      notFoundHandler(req, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found - undefined',
          statusCode: 404
        })
      )
    })

    it('should handle empty request object', () => {
      const req = {} as any
      notFoundHandler(req, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found - undefined',
          statusCode: 404
        })
      )
    })
  })

  describe('asyncRouter', () => {
    it('should wrap route handlers with catchAsync', () => {
      const router = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn()
      }

      const wrappedRouter = asyncRouter(router as any)

      // Test that the router methods are still available
      expect(wrappedRouter.get).toBeDefined()
      expect(wrappedRouter.post).toBeDefined()
      expect(wrappedRouter.put).toBeDefined()
      expect(wrappedRouter.delete).toBeDefined()
      expect(wrappedRouter.patch).toBeDefined()
    })

    it('should verify only functions are wrapped', () => {
      const dummyMiddleware = 'not a function'
      const originalGet = vi.fn()
      const router = {
        get: originalGet
      }

      const wrappedRouter = asyncRouter(router as any)
      wrappedRouter.get('/route', dummyMiddleware)

      // Should call the original method with the same arguments
      expect(originalGet).toHaveBeenCalledWith('/route', 'not a function')
    })

    it('should handle router with no methods', () => {
      const router = {}
      const wrappedRouter = asyncRouter(router as any)

      expect(wrappedRouter).toBeDefined()
      // asyncRouter adds methods to empty objects, so get should be a function
      expect(typeof wrappedRouter.get).toBe('function')
    })

    it('should preserve original router methods', () => {
      const originalGet = vi.fn()
      const router = { get: originalGet }
      const wrappedRouter = asyncRouter(router as any)

      wrappedRouter.get('/test')
      expect(originalGet).toHaveBeenCalled()
    })
  })
})
