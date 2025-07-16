// Firebase
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getAuth } from 'firebase-admin/auth'
// config
import { firebaseApp, firebaseStorageBucket } from '@/config/firebase.js'

// Initialize Firestore
const firestore = getFirestore(firebaseApp)

// Configure Firestore settings
firestore.settings({
  ignoreUndefinedProperties: true, // Allows undefined fields to be stripped from objects
  timestampsInSnapshots: true // Return timestamps as Timestamp objects
})

// Initialize Firebase Auth
const auth = getAuth(firebaseApp)

// Initialize Firebase Storage with bucket
const storage = getStorage(firebaseApp).bucket(firebaseStorageBucket)

export { firestore, storage, auth }
