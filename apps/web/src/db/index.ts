import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type RuntimeEnv = {
  HYPERDRIVE?: { connectionString: string }
  DATABASE_URL?: string
}

export function connectionStringFor(env: RuntimeEnv = {}): string {
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('データベース接続が未設定です。HYPERDRIVE または DATABASE_URL を設定してください。')
  }
  return connectionString
}

/** Create a request-scoped Drizzle facade. Migrations never run here. */
export function createDb(env: RuntimeEnv = {}) {
  const pool = new Pool({ connectionString: connectionStringFor(env), max: 3 })
  return { db: drizzle(pool, { schema }), pool, close: () => pool.end() }
}
