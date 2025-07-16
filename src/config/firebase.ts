// Centralized Firebase configuration object, built from environment variables.
// This is imported by db/firebase.ts to create the Firebase client.

// Firebase
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
// env
import { env } from '@/config/env.js'

// Firebase service account configuration
const serviceAccount: ServiceAccount = {
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  // The private key comes as a string with escaped newlines, so we need to replace them
  privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
}

// Initialize Firebase
const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: env.FIREBASE_STORAGE_BUCKET
})

export { firebaseApp }

export const firebaseStorageBucket = env.FIREBASE_STORAGE_BUCKET
