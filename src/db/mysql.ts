// MySQL
import mysql from 'mysql2/promise'
// config
import { mysqlConfig } from '@/config/mysql.js'

// Create a MySQL connection pool with sensible defaults for templates.
// Adjust pool options as needed for your environment.
const pool = mysql.createPool({
  ...mysqlConfig,
  waitForConnections: true, // Queue connection requests if pool is full
  connectionLimit: 10 // Max simultaneous connections (adjust as needed)
  // connectTimeout: 10000,      // Optional: ms before connection attempt times out
  // acquireTimeout: 10000,      // Optional: ms before acquiring a connection times out
  // multipleStatements: false,  // Optional: allow multiple SQL statements per query
  // queueLimit: 0,              // Optional: max queued connection requests (0 = unlimited)
})

export const mysqlPool = pool
