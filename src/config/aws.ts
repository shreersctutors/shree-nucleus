// Centralized AWS configuration objects, built from environment variables.
// These are imported in the db like the db/s3.ts where we create the S3 client.

import { env } from '@/config/env.js'

// S3 configuration options
interface S3Config {
  region: string
  s3Bucket: string
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
  }
}

// Create S3 configuration using the centralized env object
const s3Config: S3Config = {
  region: env.AWS_REGION,
  s3Bucket: env.AWS_S3_BUCKET
}

// Add credentials if provided via environment variables
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
}

export { s3Config }
