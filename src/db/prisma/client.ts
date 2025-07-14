// External libraries
import { PrismaClient } from '@/lib/prisma/index.js'

// Create a global Prisma client instance
const prisma = new PrismaClient()

export { prisma }
