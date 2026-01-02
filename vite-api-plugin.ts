/**
 * Vite plugin that adds API endpoints for canvas control
 *
 * Endpoints:
 * - POST /api/canvas/spawn - Queue a terminal spawn command
 * - GET /api/canvas/pending - Get pending spawn commands
 * - DELETE /api/canvas/pending/:id - Clear a processed command
 */

import type { Plugin, ViteDevServer } from 'vite'

interface SpawnCommand {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  command?: string
  profile?: string
  createdAt: number
}

// In-memory queue of pending spawn commands
const pendingCommands: SpawnCommand[] = []

function generateId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function canvasApiPlugin(): Plugin {
  return {
    name: 'canvas-api',
    configureServer(server: ViteDevServer) {
      // POST /api/canvas/spawn - Add spawn command to queue
      server.middlewares.use('/api/canvas/spawn', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          const data = JSON.parse(body)

          const command: SpawnCommand = {
            id: generateId(),
            name: data.name || 'Terminal',
            x: typeof data.x === 'number' ? data.x : 100,
            y: typeof data.y === 'number' ? data.y : 100,
            width: typeof data.width === 'number' ? data.width : 600,
            height: typeof data.height === 'number' ? data.height : 400,
            command: data.command,
            profile: data.profile,
            createdAt: Date.now()
          }

          pendingCommands.push(command)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            success: true,
            command,
            message: `Terminal spawn queued: ${command.name} at (${command.x}, ${command.y})`
          }))
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid request'
          }))
        }
      })

      // GET /api/canvas/pending - Get all pending commands
      server.middlewares.use('/api/canvas/pending', (req, res, next) => {
        if (req.method !== 'GET') {
          return next()
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          commands: pendingCommands
        }))
      })

      // POST /api/canvas/ack - Acknowledge processed commands
      server.middlewares.use('/api/canvas/ack', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          const data = JSON.parse(body)
          const ids: string[] = Array.isArray(data.ids) ? data.ids : [data.id]

          // Remove acknowledged commands
          for (const id of ids) {
            const index = pendingCommands.findIndex(c => c.id === id)
            if (index !== -1) {
              pendingCommands.splice(index, 1)
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, remaining: pendingCommands.length }))
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid request'
          }))
        }
      })

      // Health check
      server.middlewares.use('/api/canvas/health', (req, res, next) => {
        if (req.method !== 'GET') {
          return next()
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          status: 'ok',
          pendingCount: pendingCommands.length
        }))
      })
    }
  }
}
