import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateCreateUser } from './auth.requestHygiene.js'
import { createAppError } from '@/middleware/error/index.js'

vi.mock('@/middleware/error/index.js')
const mockCreateAppError = vi.mocked(createAppError)
mockCreateAppError.mockImplementation((msg, code) => new Error(msg) as any)

describe('validateCreateUser', () => {
  let mockReq: any
  let mockRes: any
  let mockNext: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockReq = { body: {} }
    mockRes = {}
    mockNext = vi.fn()
    vi.clearAllMocks()
  })

  it('should pass for valid data', () => {
    mockReq.body = {
      user_email: 'test@example.com',
      user_role: 1,
      user_country: 'USA'
    }
    validateCreateUser(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should fail for missing user_country', () => {
    mockReq.body = {
      user_email: 'test@example.com',
      user_role: 1
    }
    validateCreateUser(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should fail for invalid email', () => {
    mockReq.body = {
      user_email: 'not-an-email',
      user_role: 1,
      user_country: 'USA'
    }
    validateCreateUser(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
  })
})
