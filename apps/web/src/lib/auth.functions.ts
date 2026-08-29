import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getAuth } from './auth.server'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth, close } = await getAuth()
  try {
    return await auth.api.getSession({ headers: getRequestHeaders() })
  } finally {
    await close()
  }
})

export const ensureSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth, close } = await getAuth()
  try {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('Unauthorized')
    return session
  } finally {
    await close()
  }
})
