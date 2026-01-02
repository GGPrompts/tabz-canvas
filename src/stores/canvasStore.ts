import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CanvasTerminal {
  id: string
  sessionId: string | null // tmux session ID from TabzChrome
  name: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  profile?: string
}

interface CanvasState {
  // Viewport
  offset: { x: number; y: number }
  zoom: number

  // Terminals
  terminals: CanvasTerminal[]

  // Actions
  setOffset: (offset: { x: number; y: number }) => void
  setZoom: (zoom: number) => void

  spawnTerminal: (options?: Partial<CanvasTerminal>) => void
  updateTerminal: (id: string, updates: Partial<CanvasTerminal>) => void
  removeTerminal: (id: string) => void

  // Connection
  backendConnected: boolean
  setBackendConnected: (connected: boolean) => void
}

// Generate unique ID
const generateId = () => `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Find non-overlapping position for new terminal
const findFreePosition = (terminals: CanvasTerminal[]): { x: number; y: number } => {
  const baseX = 100
  const baseY = 100
  const offsetStep = 50

  let x = baseX
  let y = baseY
  let attempts = 0

  while (attempts < 20) {
    const overlapping = terminals.some(
      (t) =>
        Math.abs(t.position.x - x) < 100 &&
        Math.abs(t.position.y - y) < 100
    )

    if (!overlapping) break

    x = baseX + (attempts % 5) * offsetStep
    y = baseY + Math.floor(attempts / 5) * offsetStep
    attempts++
  }

  return { x, y }
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Viewport
      offset: { x: 0, y: 0 },
      zoom: 1,

      // Terminals
      terminals: [],

      // Connection
      backendConnected: false,

      setOffset: (offset) => set({ offset }),
      setZoom: (zoom) => set({ zoom }),

      spawnTerminal: (options = {}) => {
        const { terminals } = get()
        const position = options.position || findFreePosition(terminals)

        const newTerminal: CanvasTerminal = {
          id: generateId(),
          sessionId: null,
          name: options.name || `Terminal ${terminals.length + 1}`,
          position,
          size: options.size || { width: 600, height: 400 },
          profile: options.profile,
        }

        set({ terminals: [...terminals, newTerminal] })
      },

      updateTerminal: (id, updates) =>
        set((state) => ({
          terminals: state.terminals.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      removeTerminal: (id) =>
        set((state) => ({
          terminals: state.terminals.filter((t) => t.id !== id),
        })),

      setBackendConnected: (connected) => set({ backendConnected: connected }),
    }),
    {
      name: 'tabz-canvas-state',
      partialize: (state) => ({
        offset: state.offset,
        zoom: state.zoom,
        terminals: state.terminals,
      }),
    }
  )
)
