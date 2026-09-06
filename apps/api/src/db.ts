import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

/**
 * A single PrismaClient for the whole process. Instantiating more than one
 * exhausts the Postgres connection pool quickly under Vitest, which runs
 * suites in the same fork.
 */
export const prisma = new PrismaClient()
