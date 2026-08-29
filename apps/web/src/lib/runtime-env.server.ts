import type { RuntimeEnv } from '../db'

export type AuthRuntimeEnv = RuntimeEnv & {
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

/** Resolve bindings per request; the fallback keeps local Vitest and Node tooling useful. */
export async function getRuntimeEnv(): Promise<AuthRuntimeEnv> {
  try {
    const worker = await import('cloudflare:workers')
    return worker.env as unknown as AuthRuntimeEnv
  } catch {
    return process.env as AuthRuntimeEnv
  }
}

export function requireAuthConfiguration(env: AuthRuntimeEnv): Required<Pick<AuthRuntimeEnv, 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>> {
  const missing = ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'].filter((key) => !env[key as keyof AuthRuntimeEnv])
  if (missing.length) throw new Error(`認証設定が不足しています: ${missing.join(', ')}`)
  if (env.BETTER_AUTH_SECRET!.length < 32) throw new Error('BETTER_AUTH_SECRET は32文字以上で設定してください')
  return env as Required<Pick<AuthRuntimeEnv, 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>>
}
