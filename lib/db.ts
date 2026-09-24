import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { attendancePool?: Pool }

export const pool = globalForDb.attendancePool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') globalForDb.attendancePool = pool
