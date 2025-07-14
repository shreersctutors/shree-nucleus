// External libraries
import { MongoClient } from 'mongodb'

// Import preloaded environment variables from env.ts
import { env } from '@/config/env.js'

// MongoDB connection configuration
const mongoUrl = env.MONGODB_URL
const dbName = env.MONGODB_DB

// Create MongoDB client
const mongoClient = new MongoClient(mongoUrl)

// Connect to MongoDB
const connectMongo = async (): Promise<MongoClient> => {
  try {
    await mongoClient.connect()
    console.log('Connected to MongoDB')
    return mongoClient
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}

// Get database instance
const getDb = async () => {
  const client = await connectMongo()
  return client.db(dbName)
}

// Export the database instance for use in modules
export const mongoDb = await getDb()
