// zod
import { z } from 'zod'
// middleware
import { createAppError } from '@/middleware/error/index.js'

//  ------------  User ------------

export const createUserSchema = z.object({
  user_email: z.string().email('Valid email is required'),
  user_role: z.number(),
  user_country: z.enum(['CANADA', 'INDIA', 'UK', 'USA'])
})

export const validateCreateUser = (req: any, res: any, next: any): void => {
  try {
    const validatedData = createUserSchema.parse(req.body)
    req.body = validatedData
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createAppError('Request Data Validation failed', 422))
    } else {
      next(error)
    }
  }
}
