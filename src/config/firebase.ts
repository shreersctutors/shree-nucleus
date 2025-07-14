import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getAuth } from 'firebase-admin/auth'
// import env from '@/config/env.js'
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

// Initialize Firestore
const firestoreDb = getFirestore(firebaseApp)

// Initialize Firebase Auth
const auth = getAuth(firebaseApp)

// Initialize Firebase Storage with bucket
const storage = getStorage(firebaseApp).bucket(env.FIREBASE_STORAGE_BUCKET)

// Configure Firestore settings
firestoreDb.settings({
  ignoreUndefinedProperties: true, // Allows undefined fields to be stripped from objects
  timestampsInSnapshots: true // Return timestamps as Timestamp objects
})

export { firestoreDb, storage, auth }
