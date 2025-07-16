// Centralized MongoDB configuration object, built from environment variables.
// This is imported by db/mongodb.ts to create the MongoDB client.

// env
import { env } from './env.js'

export const mongodbConfig = {
  uri: env.MONGODB_URI,
  dbName: env.MONGODB_DB
  // Add options here if needed, e.g.:
  // options: { useNewUrlParser: true, useUnifiedTopology: true }
}
