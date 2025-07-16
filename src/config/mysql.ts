// Centralized MySQL configuration object, built from environment variables.
// This is imported by db/mysql.ts to create the connection pool.

// env
import { env } from './env.js'

export const mysqlConfig = {
  host: env.PROD_MYSQL_HOST,
  port: env.PROD_MYSQL_PORT || 3306,
  user: env.PROD_MYSQL_USER,
  password: env.PROD_MYSQL_PASSWORD,
  database: env.PROD_MYSQL_DB_NAME
}
