import { useEffect, useRef, useState, useCallback } from 'react'
import { useCanvasStore } from './stores/canvasStore'
import { CanvasTerminal } from './components/CanvasTerminal'
import { Toolbar } from './components/Toolbar'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  const {
    offset,
    zoom,
    terminals,
    setOffset,
    setZoom,
    spawnTerminal,
  } = useCanvasStore()

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on middle mouse or when clicking empty canvas
    if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    })
  }, [isPanning, startPan, setOffset])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(Math.max(zoom * delta, 0.25), 2)

    // Zoom toward cursor position
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newOffset = {
        x: mouseX - (mouseX - offset.x) * (newZoom / zoom),
        y: mouseY - (mouseY - offset.y) * (newZoom / zoom),
      }

      setOffset(newOffset)
    }

    setZoom(newZoom)
  }, [zoom, offset, setZoom, setOffset])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spawn terminal with Ctrl+N
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        spawnTerminal()
      }
      // Reset view with Ctrl+0
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        setOffset({ x: 0, y: 0 })
        setZoom(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [spawnTerminal, setOffset, setZoom])

  return (
    <div className="h-full w-full flex flex-col bg-[var(--background)]">
      <Toolbar />

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(var(--border) 1px, transparent 1px),
              linear-gradient(90deg, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
          }}
        />

        {/* Canvas content */}
        <div
          className="absolute"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {terminals.map((terminal) => (
            <CanvasTerminal
              key={terminal.id}
              terminal={terminal}
            />
          ))}
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--muted-foreground)]">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  )
}

export default App
