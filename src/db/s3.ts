import { S3Client } from '@aws-sdk/client-s3'
// aws config
import { s3Config } from '@/config/aws.js'

export const s3Client = new S3Client({
  region: s3Config.region,
  credentials: s3Config.credentials
})
