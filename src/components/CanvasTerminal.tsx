import { useRef, useState, useCallback, useEffect } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useCanvasStore, type CanvasTerminal as CanvasTerminalType } from '../stores/canvasStore'
import '@xterm/xterm/css/xterm.css'

interface Props {
  terminal: CanvasTerminalType
}

export function CanvasTerminal({ terminal }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })

  const { updateTerminal, removeTerminal, setBackendConnected } = useCanvasStore()

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#e4e4e7',
        cursor: '#22c55e',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#22c55e40',
      },
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.open(terminalRef.current)

    // Fit after a short delay to ensure container is sized
    setTimeout(() => fitAddon.fit(), 50)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Connect to TabzChrome backend
    connectToBackend(xterm)

    return () => {
      wsRef.current?.close()
      xterm.dispose()
    }
  }, [])

  // Connect to TabzChrome backend via WebSocket
  const connectToBackend = async (xterm: Terminal) => {
    try {
      // First, spawn a session via REST API
      const tokenRes = await fetch('http://localhost:8129/api/auth-token')
      if (!tokenRes.ok) {
        xterm.writeln('\x1b[31mFailed to get auth token. Is TabzChrome backend running?\x1b[0m')
        return
      }
      const { token } = await tokenRes.json()

      const spawnRes = await fetch('http://localhost:8129/api/spawn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify({
          name: terminal.name,
          workingDir: '~',
        }),
      })

      if (!spawnRes.ok) {
        xterm.writeln('\x1b[31mFailed to spawn terminal session\x1b[0m')
        return
      }

      const { session } = await spawnRes.json()
      updateTerminal(terminal.id, { sessionId: session.name })

      // Connect WebSocket
      const ws = new WebSocket(`ws://localhost:8129?sessionId=${session.name}&token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        setBackendConnected(true)
        xterm.writeln('\x1b[32mConnected to TabzChrome backend\x1b[0m')
        xterm.writeln('')

        // Request terminal dimensions
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
          const dims = fitAddonRef.current.proposeDimensions()
          if (dims) {
            ws.send(JSON.stringify({
              type: 'resize',
              payload: { cols: dims.cols, rows: dims.rows },
            }))
          }
        }
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'output') {
          xterm.write(data.payload)
        }
      }

      ws.onclose = () => {
        setBackendConnected(false)
        xterm.writeln('\x1b[33mDisconnected from backend\x1b[0m')
      }

      ws.onerror = () => {
        xterm.writeln('\x1b[31mWebSocket error\x1b[0m')
      }

      // Send input to backend
      xterm.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', payload: data }))
        }
      })
    } catch (err) {
      xterm.writeln(`\x1b[31mConnection error: ${err}\x1b[0m`)
      xterm.writeln('\x1b[33mMake sure TabzChrome backend is running on port 8129\x1b[0m')
    }
  }

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit()
        const dims = fitAddonRef.current.proposeDimensions()
        if (dims) {
          wsRef.current.send(JSON.stringify({
            type: 'resize',
            payload: { cols: dims.cols, rows: dims.rows },
          }))
        }
      }
    }

    // Debounce resize
    let timeout: ReturnType<typeof setTimeout>
    const debouncedResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeout)
    }
  }, [])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - terminal.position.x,
      y: e.clientY - terminal.position.y,
    })
  }, [terminal.position])

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const zoom = useCanvasStore.getState().zoom
    updateTerminal(terminal.id, {
      position: {
        x: (e.clientX - dragStart.x) / zoom,
        y: (e.clientY - dragStart.y) / zoom,
      },
    })
  }, [isDragging, dragStart, terminal.id, updateTerminal])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      width: terminal.size.width,
      height: terminal.size.height,
      x: e.clientX,
      y: e.clientY,
    })
  }, [terminal.size])

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const zoom = useCanvasStore.getState().zoom
    const deltaX = (e.clientX - resizeStart.x) / zoom
    const deltaY = (e.clientY - resizeStart.y) / zoom

    updateTerminal(terminal.id, {
      size: {
        width: Math.max(300, resizeStart.width + deltaX),
        height: Math.max(200, resizeStart.height + deltaY),
      },
    })

    // Fit terminal after resize
    if (fitAddonRef.current) {
      fitAddonRef.current.fit()
    }
  }, [isResizing, resizeStart, terminal.id, updateTerminal])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    // Final fit after resize ends
    if (fitAddonRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      fitAddonRef.current.fit()
      const dims = fitAddonRef.current.proposeDimensions()
      if (dims) {
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          payload: { cols: dims.cols, rows: dims.rows },
        }))
      }
    }
  }, [])

  // Global mouse listeners for drag/resize
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDrag, handleDragEnd])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  // Fit terminal when size changes
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 50)
    }
  }, [terminal.size])

  return (
    <div
      className="absolute bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shadow-xl"
      style={{
        left: terminal.position.x,
        top: terminal.position.y,
        width: terminal.size.width,
        height: terminal.size.height,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-[var(--muted)] border-b border-[var(--border)] cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
          <span className="text-xs font-medium truncate max-w-[200px]">
            {terminal.name}
          </span>
        </div>
        <button
          onClick={() => removeTerminal(terminal.id)}
          className="p-1 hover:bg-[var(--background)] rounded transition-colors"
          title="Close terminal"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="h-[calc(100%-36px)] p-1"
        style={{ background: '#0a0a0a' }}
      />

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
      >
        <svg
          className="w-3 h-3 absolute bottom-0.5 right-0.5 text-[var(--muted-foreground)]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
        </svg>
      </div>
    </div>
  )
}
