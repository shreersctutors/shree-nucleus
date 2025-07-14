import mysql from 'mysql2/promise'
// import preloaded environment variables from env.ts
import { env } from '@/config/env.js'

// MySQL connection pool configuration
const poolConfig = {
  host: env.PROD_MYSQL_HOST,
  user: env.PROD_MYSQL_USER,
  password: env.PROD_MYSQL_PASSWORD,
  database: env.PROD_MYSQL_DB_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  connectTimeout: 60 * 1000, // 1 min = 60000ms (default 10000ms)
  acquireTimeout: 60 * 1000, // 1 min = 60000ms (default 10000ms)
  timeout: 60 * 1000, // 1 min = 60000ms (default 40000ms)
  multipleStatements: true,
  queueLimit: 0
}

// Create a connection pool
const pool = mysql.createPool(poolConfig)

export const mysqlPool = pool
