// Firebase
import { auth } from '@/db/firebase.js'

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
