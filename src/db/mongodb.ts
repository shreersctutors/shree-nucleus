// External libraries
import { MongoClient, Db } from 'mongodb'

// import mongodb config
import { mongodbConfig } from '@/config/mongodb.js'

// Create MongoDB client
const mongoClient = new MongoClient(mongodbConfig.uri)

// Connect to MongoDB with error handling
export const connectMongo = async (): Promise<MongoClient> => {
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
export const getDb = async (): Promise<Db> => {
  const client = await connectMongo()
  return client.db(mongodbConfig.dbName)
}
