import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { verifyToken, requireRole } from './verifyToken.js'
import { createAppError } from '@/middleware/error/errorHandler.js'

// Mock Firebase auth
vi.mock('@/db/firebase.js', () => ({
  auth: {
    verifyIdToken: vi.fn()
  }
}))

// Mock the error handler
vi.mock('@/middleware/error/errorHandler.js', () => ({
  createAppError: vi.fn()
}))

// Mock env
vi.mock('@/config/env.js', () => ({
  env: { NODE_ENV: 'test' }
}))

// Import the mocked modules
import { auth } from '@/db/firebase.js'

describe('Security Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  // Helper function to set Bearer token
  const setBearerToken = (token: string) => {
    mockReq.headers = { authorization: `Bearer ${token}` }
  }

  // Helper function to verify req.user is not mutated in error cases
  const expectUserNotMutated = () => {
    expect(mockReq.user).toBeUndefined()
  }

  // Helper function to verify Firebase is not called
  const expectFirebaseNotCalled = () => {
    expect(auth.verifyIdToken).not.toHaveBeenCalled()
  }

  // Helper function to verify successful next() call
  const expectSuccessfulNext = () => {
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith()
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
  }

  beforeEach(() => {
    mockReq = {
      headers: {},
      path: '/test'
    }
    mockRes = {}
    mockNext = vi.fn()
    vi.clearAllMocks()
  })

  describe('verifyToken', () => {
    it('should verify valid token and attach user to request', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'admin'
      }
      vi.mocked(auth.verifyIdToken).mockResolvedValue(mockDecodedToken as any)
      setBearerToken('valid-token')

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(auth.verifyIdToken).toHaveBeenCalledWith('valid-token')
      expect(mockReq.user).toEqual({
        ...mockDecodedToken,
        role: 'admin'
      })
      expectSuccessfulNext()
    })

    it('should handle missing authorization header', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('No authorization token provided') as any)

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('No authorization token provided', 401)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
      expectFirebaseNotCalled()
    })

    it('should handle invalid authorization format', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Invalid authorization format') as any)
      mockReq.headers = {
        authorization: 'InvalidFormat token'
      }

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith(
        'Invalid authorization format. Use Bearer token',
        401
      )
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
      expectFirebaseNotCalled()
    })

    it('should handle expired token', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Token expired') as any)
      setBearerToken('expired-token')

      const error = new Error('auth/id-token-expired')
      vi.mocked(auth.verifyIdToken).mockRejectedValue(error)

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Token expired. Please sign in again', 401)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
    })

    it('should handle revoked token', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Token revoked') as any)
      setBearerToken('revoked-token')

      const error = new Error('auth/id-token-revoked')
      vi.mocked(auth.verifyIdToken).mockRejectedValue(error)

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith(
        'Token has been revoked. Please sign in again',
        401
      )
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
    })

    it('should handle invalid token', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Invalid token') as any)
      setBearerToken('invalid-token')

      const error = new Error('auth/invalid-id-token')
      vi.mocked(auth.verifyIdToken).mockRejectedValue(error)

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Invalid token. Please sign in again', 401)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
    })

    it('should handle generic Firebase errors', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Authentication failed') as any)
      setBearerToken('bad-token')

      const error = new Error('Some other Firebase error')
      vi.mocked(auth.verifyIdToken).mockRejectedValue(error)

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Failed to authenticate user', 401)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
    })

    it('should handle non-Error objects from Firebase', async () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Authentication failed') as any)
      setBearerToken('bad-token')

      vi.mocked(auth.verifyIdToken).mockRejectedValue('String error')

      await verifyToken(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Failed to authenticate user', 401)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expectUserNotMutated()
    })
  })

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      mockReq.user = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'admin'
      } as any

      const roleMiddleware = requireRole(['admin', 'user'])
      roleMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expectSuccessfulNext()
    })

    it('should deny access for user without required role', () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Forbidden') as any)

      mockReq.user = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'user'
      } as any

      const roleMiddleware = requireRole(['admin'])
      roleMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Forbidden: insufficient permissions', 403)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle case-insensitive role matching', () => {
      mockReq.user = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'ADMIN'
      } as any

      const roleMiddleware = requireRole(['admin', 'user'])
      roleMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expectSuccessfulNext()
    })

    it('should deny access for user with no role', () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Forbidden') as any)

      mockReq.user = {
        uid: 'user123',
        email: 'test@example.com'
        // no role
      } as any

      const roleMiddleware = requireRole(['admin'])
      roleMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Forbidden: insufficient permissions', 403)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should deny access when no user is attached to request', () => {
      const mockCreateAppError = vi.mocked(createAppError)
      mockCreateAppError.mockReturnValue(new Error('Forbidden') as any)

      // No user attached to request

      const roleMiddleware = requireRole(['admin'])
      roleMiddleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockCreateAppError).toHaveBeenCalledWith('Forbidden: insufficient permissions', 403)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
