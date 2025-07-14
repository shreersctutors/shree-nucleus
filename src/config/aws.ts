import { S3Client } from '@aws-sdk/client-s3'
// import env from '@/config/env.js'
import { env } from '@/config/env.js'

// Configuration options
interface AwsConfig {
  region: string
  s3Bucket: string
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
  }
}

// Create AWS configuration using the centralized env object
const awsConfig: AwsConfig = {
  region: env.AWS_REGION,
  s3Bucket: env.AWS_S3_BUCKET
}

// Add credentials if provided via environment variables
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
}

// Initialize S3 client
const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials
})

export { s3Client, awsConfig }
