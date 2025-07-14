import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
// This should be the ONLY place in the application where dotenv.config() is called
const envPath = path.resolve(__dirname, '../../.env')
dotenv.config({ path: envPath })

// Log that environment variables have been loaded
console.log(`Environment loaded: ${process.env.NODE_ENV || 'development'}`)

// Define environment variable structure with types
interface EnvConfig {
  // Server configuration
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number

  // AWS configuration
  AWS_REGION: string
  AWS_OUTPUT: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_S3_BUCKET: string

  // MySQL configuration
  PROD_MYSQL_HOST: string
  PROD_MYSQL_USER: string
  PROD_MYSQL_PASSWORD: string
  PROD_MYSQL_DB_NAME: string
  // Prisma configuration
  DATABASE_URL: string

  // MongoDB configuration
  MONGODB_URL: string
  MONGODB_DB: string

  // Firebase configuration
  FIREBASE_PROJECT_ID: string
  FIREBASE_PRIVATE_KEY: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_STORAGE_BUCKET: string
}

// Default values for development
const defaultConfig = {
  NODE_ENV: 'development' as const,
  PORT: 3000,
  AWS_REGION: 'us-east-1',
  AWS_OUTPUT: 'json'
}

// Helper function to get environment variables with type conversion
const getEnvVar = <T>(key: string, defaultValue?: T): T => {
  const value = process.env[key]
  if (!value) {
    if (defaultValue) return defaultValue

    // if value is not set, throw error
    throw new Error(`Environment variable ${key} is not set`)
  }

  return value as unknown as T
}

// Helper function for enum-like string values
const getEnvVarAsEnum = <T extends string>(key: string, defaultValue?: T): T => {
  const value = process.env[key]
  if (!value) {
    if (defaultValue) return defaultValue

    // if value is not set, throw error
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value as T
}

// Create and export the environment configuration
export const env: EnvConfig = {
  // Server configuration
  NODE_ENV: getEnvVarAsEnum<'development' | 'production' | 'test'>(
    'NODE_ENV',
    defaultConfig.NODE_ENV
  ),
  PORT: getEnvVar<number>('PORT', defaultConfig.PORT),

  // AWS configuration
  AWS_REGION: getEnvVar<string>('AWS_REGION'),
  AWS_OUTPUT: getEnvVar<string>('AWS_OUTPUT'),
  AWS_ACCESS_KEY_ID: getEnvVar<string>('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getEnvVar<string>('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET: getEnvVar<string>('AWS_S3_BUCKET'),

  // MySQL configuration
  PROD_MYSQL_HOST: getEnvVar<string>('PROD_MYSQL_HOST'),
  PROD_MYSQL_USER: getEnvVar<string>('PROD_MYSQL_USER'),
  PROD_MYSQL_PASSWORD: getEnvVar<string>('PROD_MYSQL_PASSWORD'),
  PROD_MYSQL_DB_NAME: getEnvVar<string>('PROD_MYSQL_DB_NAME'),
  // Prisma configuration
  DATABASE_URL: getEnvVar<string>('DATABASE_URL'),

  // MongoDB configuration
  MONGODB_URL: getEnvVar<string>('MONGODB_URL'),
  MONGODB_DB: getEnvVar<string>('MONGODB_DB'),

  // Firebase configuration
  FIREBASE_PROJECT_ID: getEnvVar<string>('FIREBASE_PROJECT_ID'),
  FIREBASE_PRIVATE_KEY: getEnvVar<string>('FIREBASE_PRIVATE_KEY'),
  FIREBASE_CLIENT_EMAIL: getEnvVar<string>('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_STORAGE_BUCKET: getEnvVar<string>('FIREBASE_STORAGE_BUCKET')
}

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production'

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development'

// Helper function to check if we're in test
export const isTest = env.NODE_ENV === 'test'

export default env
