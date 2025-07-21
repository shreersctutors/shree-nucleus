import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFirebaseUser } from './auth.service.js'
import { auth } from '@/db/firebase.js'

// Mock Firebase auth and Firestore
vi.mock('@/db/firebase.js')

const mockAuth = vi.mocked(auth)

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createFirebaseUser', () => {
    it('should create Firebase user with custom password', async () => {
      const email = 'test@example.com'
      const password = 'customPassword123'
      const mockUserRecord = {
        uid: 'firebase_uid_123',
        email: 'test@example.com'
      }

      mockAuth.createUser.mockResolvedValue(mockUserRecord as any)

      const result = await createFirebaseUser(email, password)

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'customPassword123',
        emailVerified: false,
        disabled: false
      })
      expect(result).toBe('firebase_uid_123')
    })

    it('should create Firebase user with default password', async () => {
      const email = 'test@example.com'
      const mockUserRecord = {
        uid: 'firebase_uid_456',
        email: 'test@example.com'
      }

      mockAuth.createUser.mockResolvedValue(mockUserRecord as any)

      const result = await createFirebaseUser(email)

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'testpassword',
        emailVerified: false,
        disabled: false
      })
      expect(result).toBe('firebase_uid_456')
    })

    it('should throw error when Firebase creation fails', async () => {
      expect.hasAssertions()

      const email = 'test@example.com'
      const error = new Error('Firebase creation failed')

      mockAuth.createUser.mockRejectedValue(error)

      await expect(createFirebaseUser(email)).rejects.toThrow('Firebase creation failed')
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'testpassword',
        emailVerified: false,
        disabled: false
      })
    })

    it('should handle Firebase structured errors', async () => {
      expect.hasAssertions()

      const email = 'test@example.com'
      const firebaseError = {
        code: 'auth/email-already-exists',
        message: 'The email address is already in use by another account.'
      }

      mockAuth.createUser.mockRejectedValue(firebaseError)

      await expect(createFirebaseUser(email)).rejects.toMatchObject({
        code: 'auth/email-already-exists'
      })
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'testpassword',
        emailVerified: false,
        disabled: false
      })
    })

    it('should handle other Firebase error codes', async () => {
      expect.hasAssertions()

      const email = 'test@example.com'
      const firebaseError = {
        code: 'auth/invalid-email',
        message: 'The email address is badly formatted.'
      }

      mockAuth.createUser.mockRejectedValue(firebaseError)

      await expect(createFirebaseUser(email)).rejects.toMatchObject({
        code: 'auth/invalid-email'
      })
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'testpassword',
        emailVerified: false,
        disabled: false
      })
    })

    it('should handle empty email', async () => {
      const email = ''
      const mockUserRecord = {
        uid: 'firebase_uid_789',
        email: ''
      }

      mockAuth.createUser.mockResolvedValue(mockUserRecord as any)

      const result = await createFirebaseUser(email)

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: '',
        password: 'testpassword',
        emailVerified: false,
        disabled: false
      })
      expect(result).toBe('firebase_uid_789')
    })

    it('should handle email input as-is (no sanitization currently)', async () => {
      const email = ' Test@Example.COM '
      const mockUserRecord = {
        uid: 'firebase_uid_999',
        email: ' Test@Example.COM '
      }

      mockAuth.createUser.mockResolvedValue(mockUserRecord as any)

      const result = await createFirebaseUser(email)

      // Currently no sanitization - email is passed as-is
      // If sanitization is added later (e.g., email.trim().toLowerCase()),
      // this test should be updated to expect: 'test@example.com'
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: ' Test@Example.COM ',
        password: 'testpassword',
        emailVerified: false,
        disabled: false
      })
      expect(result).toBe('firebase_uid_999')
    })

    // TODO: Add test for input sanitization when implemented
    // Example test for when email normalization is added:
    // it('should normalize email input (trim and lowercase)', async () => {
    //   const email = ' Test@Example.COM '
    //   const mockUserRecord = { uid: 'firebase_uid_999', email: 'test@example.com' }
    //   mockAuth.createUser.mockResolvedValue(mockUserRecord as any)
    //
    //   const result = await createFirebaseUser(email)
    //
    //   expect(mockAuth.createUser).toHaveBeenCalledWith({
    //     email: 'test@example.com', // lowercase trimmed
    //     password: 'testpassword',
    //     emailVerified: false,
    //     disabled: false
    //   })
    //   expect(result).toBe('firebase_uid_999')
    // })
  })
})
