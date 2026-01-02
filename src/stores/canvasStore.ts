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

export type FileType = 'code' | 'markdown' | 'image' | 'text'

export interface CanvasFile {
  id: string
  name: string
  content: string
  fileType: FileType
  language?: string // for syntax highlighting
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface SavedLayout {
  id: string
  name: string
  terminals: Array<{
    name: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    profile?: string
  }>
  viewport: {
    offset: { x: number; y: number }
    zoom: number
  }
  createdAt: number
}

interface CanvasState {
  // Viewport
  offset: { x: number; y: number }
  zoom: number

  // Terminals
  terminals: CanvasTerminal[]

  // Files
  files: CanvasFile[]

  // Layouts
  layouts: SavedLayout[]

  // Actions
  setOffset: (offset: { x: number; y: number }) => void
  setZoom: (zoom: number) => void

  spawnTerminal: (options?: Partial<CanvasTerminal>) => void
  updateTerminal: (id: string, updates: Partial<CanvasTerminal>) => void
  removeTerminal: (id: string) => void

  addFile: (file: Omit<CanvasFile, 'id'>) => void
  updateFile: (id: string, updates: Partial<CanvasFile>) => void
  removeFile: (id: string) => void

  saveLayout: (name: string) => void
  loadLayout: (id: string) => void
  deleteLayout: (id: string) => void

  // Connection
  backendConnected: boolean
  setBackendConnected: (connected: boolean) => void
}

// Generate unique ID
const generateId = () => `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Find non-overlapping position for new item
const findFreePosition = (items: Array<{ position: { x: number; y: number } }>): { x: number; y: number } => {
  const baseX = 100
  const baseY = 100
  const offsetStep = 50

  let x = baseX
  let y = baseY
  let attempts = 0

  while (attempts < 20) {
    const overlapping = items.some(
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

      // Files
      files: [],

      // Layouts
      layouts: [],

      // Connection
      backendConnected: false,

      setOffset: (offset) => set({ offset }),
      setZoom: (zoom) => set({ zoom }),

      spawnTerminal: (options = {}) => {
        const { terminals, files } = get()
        const allItems = [...terminals, ...files]
        const position = options.position || findFreePosition(allItems)

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

      addFile: (file) => {
        const { terminals, files } = get()
        const allItems = [...terminals, ...files]
        const position = file.position || findFreePosition(allItems)

        const newFile: CanvasFile = {
          id: generateId(),
          ...file,
          position,
        }

        set({ files: [...files, newFile] })
      },

      updateFile: (id, updates) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        })),

      saveLayout: (name) => {
        const { terminals, offset, zoom, layouts } = get()
        const newLayout: SavedLayout = {
          id: generateId(),
          name,
          terminals: terminals.map((t) => ({
            name: t.name,
            position: t.position,
            size: t.size,
            profile: t.profile,
          })),
          viewport: { offset, zoom },
          createdAt: Date.now(),
        }
        set({ layouts: [...layouts, newLayout] })
      },

      loadLayout: (id) => {
        const { layouts } = get()
        const layout = layouts.find((l) => l.id === id)
        if (!layout) return

        // Create new terminals based on layout
        const newTerminals: CanvasTerminal[] = layout.terminals.map((t) => ({
          id: generateId(),
          sessionId: null,
          name: t.name,
          position: t.position,
          size: t.size,
          profile: t.profile,
        }))

        set({
          terminals: newTerminals,
          offset: layout.viewport.offset,
          zoom: layout.viewport.zoom,
        })
      },

      deleteLayout: (id) =>
        set((state) => ({
          layouts: state.layouts.filter((l) => l.id !== id),
        })),

      setBackendConnected: (connected) => set({ backendConnected: connected }),
    }),
    {
      name: 'tabz-canvas-state',
      partialize: (state) => ({
        offset: state.offset,
        zoom: state.zoom,
        terminals: state.terminals,
        files: state.files,
        layouts: state.layouts,
      }),
    }
  )
)
