// External libraries
import { prisma } from '@/db/prisma/client.js'

/**
 * Create new authentication record
 */
export const createAuthentication = async (data: {
  user_email: string
  user_role: number
  user_country?: 'CANADA' | 'INDIA' | 'UK' | 'USA'
}) => {
  return await prisma.authentication.create({
    data: {
      user_email: data.user_email,
      user_role: data.user_role,
      user_country: (data.user_country as any) ?? null
    }
  })
}
