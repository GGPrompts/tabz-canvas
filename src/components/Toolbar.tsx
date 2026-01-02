import { useCanvasStore } from '../stores/canvasStore'

export function Toolbar() {
  const { spawnTerminal, terminals, zoom, setZoom, setOffset, backendConnected } = useCanvasStore()

  const handleResetView = () => {
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-[var(--primary)]">
          Tabz Canvas
        </h1>
        <span className="text-xs text-[var(--muted-foreground)]">
          {terminals.length} terminal{terminals.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[var(--muted)]">
          <div
            className={`w-2 h-2 rounded-full ${
              backendConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-[var(--muted-foreground)]">
            {backendConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--muted)]">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
            className="px-2 py-0.5 text-sm hover:bg-[var(--background)] rounded"
          >
            -
          </button>
          <span className="w-12 text-center text-xs text-[var(--muted-foreground)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="px-2 py-0.5 text-sm hover:bg-[var(--background)] rounded"
          >
            +
          </button>
        </div>

        <button
          onClick={handleResetView}
          className="px-3 py-1 text-xs rounded bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
        >
          Reset View
        </button>

        <button
          onClick={() => spawnTerminal()}
          className="px-3 py-1 text-xs rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          + New Terminal
        </button>
      </div>
    </div>
  )
}
