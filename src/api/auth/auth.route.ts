// express.js
import { Router } from 'express'
// middleware
import { asyncRouter } from '@/middleware/error/index.js'
// security
import { verifyToken, requireRole } from '@/middleware/security/index.js'
// route controller
import { createUserController } from './auth.routeController.js'
// request hygiene
import { validateCreateUser } from './auth.requestHygiene.js'

const router = asyncRouter(Router())

/**
 * @route POST /auth/user
 * @description Create a new user
 * @access Public (customize as needed)
 */
router.post('/user', verifyToken, requireRole(['admin']), validateCreateUser, createUserController)

export default router
