import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/v1/health')({
  server: {
    handlers: {
      GET: () => Response.json({ ok: true, service: 'library-web' }),
    },
  },
})
