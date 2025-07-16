// Firebase
import { auth, firestore } from '@/db/firebase.js'

/**
 * Create a new user in Firebase Auth with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Firebase UID of the created user
 */
export const createFirebaseUser = async (
  email: string,
  password: string = 'testpassword'
): Promise<string> => {
  // Create user in Firebase Auth
  const userRecord = await auth.createUser({
    email,
    password,
    emailVerified: false,
    disabled: false
  })

  // Return the Firebase UID
  return userRecord.uid
}

/**
 * Get demo user information from Firestore
 */
export const getDemoUserFromFirestore = async (
  email: string
): Promise<{
  userId: string
  role: 'Demo'
  userEmail: string
  userName?: string
  userGrade?: string
  userTimezone?: string
  userPhone?: string
  userCountryCode?: string
  userCountry?: string
} | null> => {
  try {
    const inquiryDbRef = firestore.collection('inquiryDb')
    const inquirySnapshot = await inquiryDbRef.where('email', '==', email.toLowerCase()).get()

    if (!inquirySnapshot.empty) {
      const inquiryData = inquirySnapshot.docs[0].data()
      return {
        userId: inquirySnapshot.docs[0].id,
        role: 'Demo',
        userEmail: inquiryData.email,
        userName: inquiryData.name,
        userGrade: inquiryData.grade,
        userTimezone: inquiryData.timezone,
        userPhone: inquiryData.phoneNumber,
        userCountryCode: inquiryData.countryCode,
        userCountry: inquiryData.country
      }
    }

    return null
  } catch (error) {
    console.error('Error getting demo user from Firestore:', error)
    return null
  }
}

/**
 * Get tutor applicant information from Firestore
 */
export const getTutorApplicantFromFirestore = async (
  email: string
): Promise<{
  userId: string
  role: 'Tutor Applicant'
  userEmail: string
  userName?: string
  userTimezone?: string
  userPhone?: string
  userCountryCode?: string
  userCountry?: string
} | null> => {
  try {
    const utilityDoc = await firestore.collection('utility').doc('tutorApplicantDb').get()

    if (utilityDoc.exists && utilityDoc.data()?.applicants) {
      const applicants = utilityDoc.data()!.applicants
      const applicant = applicants.find(
        (app: any) => app.email.toLowerCase() === email.toLowerCase()
      )

      if (applicant) {
        return {
          userId: email, // Using email as ID for tutor applicants
          role: 'Tutor Applicant',
          userEmail: applicant.email,
          userName: applicant.name,
          userTimezone: applicant.timezone,
          userPhone: applicant.phone,
          userCountryCode: applicant.countryCode,
          userCountry: applicant.country
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting tutor applicant from Firestore:', error)
    return null
  }
}
