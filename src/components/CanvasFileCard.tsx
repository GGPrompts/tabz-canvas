import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useCanvasStore, type CanvasFile, type FileType } from '../stores/canvasStore'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { marked } from 'marked'

// File type icon component - defined outside to avoid recreating during render
function FileTypeIcon({ fileType }: { fileType: FileType }) {
  switch (fileType) {
    case 'image':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    case 'markdown':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 4H2v16h20V4zM7 15.5v-7l2.5 3 2.5-3v7h-2v-4l-1.5 2-1.5-2v4H7zm10 0h-2l-2-3h1.5V8h2v4.5H18l-2 3z" />
        </svg>
      )
    case 'code':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      )
    default:
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
  }
}

interface Props {
  file: CanvasFile
}

export function CanvasFileCard({ file }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })

  const { updateFile, removeFile } = useCanvasStore()

  // Render content based on file type
  const renderedContent = useMemo(() => {
    switch (file.fileType) {
      case 'image':
        return (
          <img
            src={file.content}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        )

      case 'markdown': {
        const html = marked.parse(file.content, { async: false }) as string
        return (
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      }

      case 'code': {
        const highlighted = file.language
          ? hljs.highlight(file.content, { language: file.language })
          : hljs.highlightAuto(file.content)
        return (
          <pre className="m-0 text-sm">
            <code
              className={`hljs language-${highlighted.language}`}
              dangerouslySetInnerHTML={{ __html: highlighted.value }}
            />
          </pre>
        )
      }

      case 'text':
      default:
        return (
          <pre className="m-0 text-sm whitespace-pre-wrap font-mono text-[var(--foreground)]">
            {file.content}
          </pre>
        )
    }
  }, [file.content, file.fileType, file.language, file.name])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - file.position.x,
      y: e.clientY - file.position.y,
    })
  }, [file.position])

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const zoom = useCanvasStore.getState().zoom
    updateFile(file.id, {
      position: {
        x: (e.clientX - dragStart.x) / zoom,
        y: (e.clientY - dragStart.y) / zoom,
      },
    })
  }, [isDragging, dragStart, file.id, updateFile])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      width: file.size.width,
      height: file.size.height,
      x: e.clientX,
      y: e.clientY,
    })
  }, [file.size])

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const zoom = useCanvasStore.getState().zoom
    const deltaX = (e.clientX - resizeStart.x) / zoom
    const deltaY = (e.clientY - resizeStart.y) / zoom

    updateFile(file.id, {
      size: {
        width: Math.max(200, resizeStart.width + deltaX),
        height: Math.max(150, resizeStart.height + deltaY),
      },
    })
  }, [isResizing, resizeStart, file.id, updateFile])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
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

  return (
    <div
      ref={containerRef}
      className="absolute bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shadow-xl"
      style={{
        left: file.position.x,
        top: file.position.y,
        width: file.size.width,
        height: file.size.height,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-[var(--muted)] border-b border-[var(--border)] cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="text-[var(--muted-foreground)]">
            <FileTypeIcon fileType={file.fileType} />
          </div>
          <span className="text-xs font-medium truncate max-w-[200px]">
            {file.name}
          </span>
          {file.language && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--background)] rounded text-[var(--muted-foreground)]">
              {file.language}
            </span>
          )}
        </div>
        <button
          onClick={() => removeFile(file.id)}
          className="p-1 hover:bg-[var(--background)] rounded transition-colors"
          title="Close file"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div
        className="h-[calc(100%-36px)] overflow-auto p-3"
        style={{
          background: file.fileType === 'code' ? '#0d1117' : 'var(--background)',
        }}
      >
        {renderedContent}
      </div>

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
