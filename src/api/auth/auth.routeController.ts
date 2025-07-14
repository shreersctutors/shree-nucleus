// Express
import type { Request, Response } from 'express'
// Services
import { createFirebaseUser } from './auth.service.js'
// Prisma
import { createAuthentication } from './auth.prisma.js'
// Middleware
// Validation

// Types
import type { CreateUserRequest, CreateUserResponse } from './auth.types.js'

/**
 * @route POST /auth/user
 * @description Create a new user
 * @param {CreateUserRequest} req.body - User data
 * @returns {Object} User creation response
 */
export const createUserController = async (
  req: Request<Record<string, never>, Record<string, never>, CreateUserRequest>,
  res: Response
): Promise<void> => {
  const { user_email, user_role, user_country } = req.body

  const firebaseUid = await createFirebaseUser(user_email, 'create password here')

  const user = await createAuthentication({
    user_email,
    user_role,
    user_country
  })

  const response: CreateUserResponse = {
    user_id: user.user_id,
    user_email: user.user_email,
    user_role: user.user_role,
    user_country: user.user_country,
    firebase_uid: firebaseUid
  }

  res.status(201).json({
    status: 201,
    message: 'User created successfully',
    data: response
  })
}
