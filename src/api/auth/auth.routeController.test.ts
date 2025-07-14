import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { createUserController } from './auth.routeController.js'
import { createFirebaseUser } from './auth.service.js'
import { createAuthentication } from './auth.prisma.js'
import type { CreateUserRequest } from './auth.types.js'

vi.mock('./auth.service.js')
vi.mock('./auth.prisma.js')

describe('createUserController', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>

  beforeEach(() => {
    mockReq = { body: {} }
    mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    vi.clearAllMocks()
  })

  it('should create a user and return 201', async () => {
    const userData: CreateUserRequest = {
      user_email: 'test@example.com',
      user_role: 1,
      user_country: 'USA'
    }
    const mockUser = { user_id: 1, ...userData }
    const mockFirebaseUid = 'firebase_uid_123'

    mockReq.body = userData
    vi.mocked(createFirebaseUser).mockResolvedValue(mockFirebaseUid)
    vi.mocked(createAuthentication).mockResolvedValue(mockUser as any)

    await createUserController(
      mockReq as Request<Record<string, never>, Record<string, never>, CreateUserRequest>,
      mockRes as Response
    )

    expect(createFirebaseUser).toHaveBeenCalledWith('test@example.com', 'create password here')
    expect(createAuthentication).toHaveBeenCalledWith(userData)
    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 201,
      message: 'User created successfully',
      data: {
        user_id: 1,
        user_email: 'test@example.com',
        user_role: 1,
        user_country: 'USA',
        firebase_uid: mockFirebaseUid
      }
    })
  })
})
