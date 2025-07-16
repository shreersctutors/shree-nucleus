import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createFirebaseUser,
  getDemoUserFromFirestore,
  getTutorApplicantFromFirestore
} from './auth.service.js'
import { auth, firestore } from '@/db/firebase.js'

// Mock Firebase auth and Firestore
vi.mock('@/db/firebase.js')

const mockAuth = vi.mocked(auth)
const mockFirestore = vi.mocked(firestore)

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

  describe('getDemoUserFromFirestore', () => {
    it('should return demo user information when found', async () => {
      const email = 'demo@example.com'
      const mockInquiryData = {
        email: 'demo@example.com',
        name: 'Demo User',
        grade: '10th Grade',
        timezone: 'UTC',
        phoneNumber: '1234567890',
        countryCode: '+1',
        country: 'US'
      }

      const mockDoc = {
        id: 'demo123',
        data: vi.fn().mockReturnValue(mockInquiryData)
      }

      const mockSnapshot = {
        empty: false,
        docs: [mockDoc]
      }

      const mockCollection = {
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getDemoUserFromFirestore(email)

      expect(mockFirestore.collection).toHaveBeenCalledWith('inquiryDb')
      expect(mockCollection.where).toHaveBeenCalledWith('email', '==', email.toLowerCase())
      expect(result).toEqual({
        userId: 'demo123',
        role: 'Demo',
        userEmail: 'demo@example.com',
        userName: 'Demo User',
        userGrade: '10th Grade',
        userTimezone: 'UTC',
        userPhone: '1234567890',
        userCountryCode: '+1',
        userCountry: 'US'
      })
    })

    it('should return demo user with minimal information when optional fields are missing', async () => {
      const email = 'demo2@example.com'
      const mockInquiryData = {
        email: 'demo2@example.com',
        name: 'Demo User 2'
        // Missing optional fields: grade, timezone, phoneNumber, countryCode, country
      }

      const mockDoc = {
        id: 'demo456',
        data: vi.fn().mockReturnValue(mockInquiryData)
      }

      const mockSnapshot = {
        empty: false,
        docs: [mockDoc]
      }

      const mockCollection = {
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getDemoUserFromFirestore(email)

      expect(result).toEqual({
        userId: 'demo456',
        role: 'Demo',
        userEmail: 'demo2@example.com',
        userName: 'Demo User 2',
        userGrade: undefined,
        userTimezone: undefined,
        userPhone: undefined,
        userCountryCode: undefined,
        userCountry: undefined
      })
    })

    it('should return null when demo user not found', async () => {
      const email = 'nonexistent@example.com'

      const mockSnapshot = {
        empty: true,
        docs: []
      }

      const mockCollection = {
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getDemoUserFromFirestore(email)

      expect(mockFirestore.collection).toHaveBeenCalledWith('inquiryDb')
      expect(mockCollection.where).toHaveBeenCalledWith('email', '==', email.toLowerCase())
      expect(result).toBeNull()
    })

    it('should handle Firestore errors gracefully', async () => {
      const email = 'error@example.com'
      const firestoreError = new Error('Firestore connection failed')

      const mockCollection = {
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(firestoreError)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getDemoUserFromFirestore(email)

      expect(result).toBeNull()
    })

    it('should handle malformed Firestore response', async () => {
      const email = 'malformed@example.com'

      const mockSnapshot = {
        empty: false,
        docs: [] // Empty docs array but empty is false
      }

      const mockCollection = {
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getDemoUserFromFirestore(email)

      expect(result).toBeNull()
    })

    it('should handle user object with null values', async () => {
      const email = 'null@example.com'
      const mockInquiryData = {
        email: 'null@example.com',
        name: null,
        grade: null,
        timezone: null,
        phoneNumber: null,
        countryCode: null,
        country: null
      }

      const mockDoc = {
        id: 'null-user',
        data: vi.fn().mockReturnValue(mockInquiryData)
      }

      const mockSnapshot = {
        empty: false,
        docs: [mockDoc]
      }

      const mockCollection = {
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getDemoUserFromFirestore(email)

      expect(result).toEqual({
        userId: 'null-user',
        role: 'Demo',
        userEmail: 'null@example.com',
        userName: null,
        userGrade: null,
        userTimezone: null,
        userPhone: null,
        userCountryCode: null,
        userCountry: null
      })
    })
  })

  describe('getTutorApplicantFromFirestore', () => {
    it('should return tutor applicant information when found', async () => {
      const email = 'applicant@example.com'
      const mockApplicant = {
        email: 'applicant@example.com',
        name: 'John Applicant',
        timezone: 'America/New_York',
        phone: '9876543210',
        countryCode: '+1',
        country: 'US'
      }

      const mockUtilityData = {
        applicants: [mockApplicant]
      }

      const mockUtilityDoc = {
        exists: true,
        data: vi.fn().mockReturnValue(mockUtilityData)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(mockFirestore.collection).toHaveBeenCalledWith('utility')
      expect(mockCollection.doc).toHaveBeenCalledWith('tutorApplicantDb')
      expect(result).toEqual({
        userId: 'applicant@example.com',
        role: 'Tutor Applicant',
        userEmail: 'applicant@example.com',
        userName: 'John Applicant',
        userTimezone: 'America/New_York',
        userPhone: '9876543210',
        userCountryCode: '+1',
        userCountry: 'US'
      })
    })

    it('should return tutor applicant with minimal information when optional fields are missing', async () => {
      const email = 'applicant2@example.com'
      const mockApplicant = {
        email: 'applicant2@example.com',
        name: 'Jane Applicant'
        // Missing optional fields: timezone, phone, countryCode, country
      }

      const mockUtilityData = {
        applicants: [mockApplicant]
      }

      const mockUtilityDoc = {
        exists: true,
        data: vi.fn().mockReturnValue(mockUtilityData)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(result).toEqual({
        userId: 'applicant2@example.com',
        role: 'Tutor Applicant',
        userEmail: 'applicant2@example.com',
        userName: 'Jane Applicant',
        userTimezone: undefined,
        userPhone: undefined,
        userCountryCode: undefined,
        userCountry: undefined
      })
    })

    it('should return null when tutor applicant not found', async () => {
      const email = 'nonexistent@example.com'

      const mockUtilityData = {
        applicants: [{ email: 'other@example.com', name: 'Other Applicant' }]
      }

      const mockUtilityDoc = {
        exists: true,
        data: vi.fn().mockReturnValue(mockUtilityData)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(mockFirestore.collection).toHaveBeenCalledWith('utility')
      expect(mockCollection.doc).toHaveBeenCalledWith('tutorApplicantDb')
      expect(result).toBeNull()
    })

    it('should return null when utility document does not exist', async () => {
      const email = 'nonexistent@example.com'

      const mockUtilityDoc = {
        exists: false,
        data: vi.fn().mockReturnValue(null)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(result).toBeNull()
    })

    it('should return null when applicants array is missing', async () => {
      const email = 'nonexistent@example.com'

      const mockUtilityData = {
        // Missing applicants array
      }

      const mockUtilityDoc = {
        exists: true,
        data: vi.fn().mockReturnValue(mockUtilityData)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(result).toBeNull()
    })

    it('should handle Firestore errors gracefully', async () => {
      const email = 'error@example.com'
      const firestoreError = new Error('Firestore connection failed')

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(firestoreError)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(result).toBeNull()
    })

    it('should handle case-insensitive email matching', async () => {
      const email = 'APPLICANT@EXAMPLE.COM'
      const mockApplicant = {
        email: 'applicant@example.com',
        name: 'Case Test Applicant'
      }

      const mockUtilityData = {
        applicants: [mockApplicant]
      }

      const mockUtilityDoc = {
        exists: true,
        data: vi.fn().mockReturnValue(mockUtilityData)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(result).toEqual({
        userId: 'APPLICANT@EXAMPLE.COM',
        role: 'Tutor Applicant',
        userEmail: 'applicant@example.com',
        userName: 'Case Test Applicant',
        userTimezone: undefined,
        userPhone: undefined,
        userCountryCode: undefined,
        userCountry: undefined
      })
    })

    it('should handle applicant object with null values', async () => {
      const email = 'null@example.com'
      const mockApplicant = {
        email: 'null@example.com',
        name: null,
        timezone: null,
        phone: null,
        countryCode: null,
        country: null
      }

      const mockUtilityData = {
        applicants: [mockApplicant]
      }

      const mockUtilityDoc = {
        exists: true,
        data: vi.fn().mockReturnValue(mockUtilityData)
      }

      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUtilityDoc)
        })
      }

      mockFirestore.collection.mockReturnValue(mockCollection as any)

      const result = await getTutorApplicantFromFirestore(email)

      expect(result).toEqual({
        userId: 'null@example.com',
        role: 'Tutor Applicant',
        userEmail: 'null@example.com',
        userName: null,
        userTimezone: null,
        userPhone: null,
        userCountryCode: null,
        userCountry: null
      })
    })
  })
})
