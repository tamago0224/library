import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { createDb } from '../db'
import { getRuntimeEnv, requireAuthConfiguration } from './runtime-env.server'
import { schema } from '../db/schema'
import { ulid } from 'ulid'

export async function getAuth() {
  const env = await getRuntimeEnv()
  const config = requireAuthConfiguration(env)
  const { db, close } = createDb(env)
  const auth = betterAuth({
    appName: 'Library',
    baseURL: config.BETTER_AUTH_URL,
    basePath: '/api/auth',
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [config.BETTER_AUTH_URL],
    socialProviders: {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    advanced: {
      database: { generateId: () => ulid() },
      useSecureCookies: config.BETTER_AUTH_URL.startsWith('https://'),
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.BETTER_AUTH_URL.startsWith('https://') },
    },
    plugins: [tanstackStartCookies()],
  })
  return { auth, close }
}
