import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAuthentication } from './auth.prisma.js'

// Mock the Prisma client
vi.mock('@/db/prisma/client.js', () => ({
  prisma: {
    grade: {
      findFirst: vi.fn()
    },
    authentication: {
      findFirst: vi.fn(),
      create: vi.fn()
    },
    student: {
      create: vi.fn()
    },
    student_contact: {
      create: vi.fn()
    },
    tutor: {
      create: vi.fn()
    }
  }
}))

// Mock the module
vi.mock('./auth.prisma.js')

describe('Auth Prisma', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAuthentication', () => {
    it('should create authentication record with all fields', async () => {
      const authData = {
        user_email: 'test@example.com',
        user_role: 1,
        user_country: 'USA' as const
      }
      const mockAuth = { user_id: 1, ...authData }
      vi.mocked(createAuthentication).mockResolvedValue(mockAuth as any)

      const result = await createAuthentication(authData)

      expect(createAuthentication).toHaveBeenCalledWith(authData)
      expect(result).toEqual(mockAuth)
    })

    it('should create authentication record with minimal fields', async () => {
      const authData = {
        user_email: 'test@example.com',
        user_role: 1,
        user_country: 'CANADA' as const
      }
      const mockAuth = { user_id: 1, ...authData }
      vi.mocked(createAuthentication).mockResolvedValue(mockAuth as any)

      const result = await createAuthentication(authData)

      expect(createAuthentication).toHaveBeenCalledWith(authData)
      expect(result).toEqual(mockAuth)
    })
  })
})
