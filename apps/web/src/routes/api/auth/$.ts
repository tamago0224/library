import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '../../../lib/auth.server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { auth, close } = await getAuth()
        try { return await auth.handler(request) } finally { await close() }
      },
      POST: async ({ request }) => {
        const { auth, close } = await getAuth()
        try { return await auth.handler(request) } finally { await close() }
      },
    },
  },
})
