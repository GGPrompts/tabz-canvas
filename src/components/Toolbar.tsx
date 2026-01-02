import { useEffect, useState, useRef } from 'react'
import { useCanvasStore } from '../stores/canvasStore'
import { useProfileStore } from '../stores/profileStore'

export function Toolbar() {
  const { spawnTerminal, terminals, zoom, setZoom, setOffset, backendConnected, layouts, saveLayout, loadLayout, deleteLayout } = useCanvasStore()
  const { profiles, selectedProfileId, isLoading, fetchProfiles, setSelectedProfile } = useProfileStore()
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [layoutName, setLayoutName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false)
        setShowSaveInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResetView = () => {
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleSpawn = () => {
    const profile = profiles.find(p => p.id === selectedProfileId)
    spawnTerminal({
      name: profile?.name || `Terminal ${terminals.length + 1}`,
      profile: selectedProfileId || undefined,
    })
  }

  const handleSaveLayout = () => {
    if (layoutName.trim()) {
      saveLayout(layoutName.trim())
      setLayoutName('')
      setShowSaveInput(false)
    }
  }

  const handleLoadLayout = (id: string) => {
    loadLayout(id)
    setShowLayoutMenu(false)
  }

  const handleDeleteLayout = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteLayout(id)
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

        {/* Layout controls */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="px-3 py-1 text-xs rounded bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
          >
            Layouts {layouts.length > 0 && `(${layouts.length})`}
          </button>

          {showLayoutMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded border border-[var(--border)] bg-[var(--card)] shadow-lg z-50">
              {/* Save layout section */}
              <div className="p-2 border-b border-[var(--border)]">
                {showSaveInput ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={layoutName}
                      onChange={(e) => setLayoutName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveLayout()}
                      placeholder="Layout name..."
                      className="flex-1 px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveLayout}
                      disabled={!layoutName.trim()}
                      className="px-2 py-1 text-xs rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="w-full px-2 py-1 text-xs text-left rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    + Save Current Layout
                  </button>
                )}
              </div>

              {/* Saved layouts list */}
              <div className="max-h-48 overflow-y-auto">
                {layouts.length === 0 ? (
                  <div className="p-2 text-xs text-[var(--muted-foreground)] text-center">
                    No saved layouts
                  </div>
                ) : (
                  layouts.map((layout) => (
                    <div
                      key={layout.id}
                      onClick={() => handleLoadLayout(layout.id)}
                      className="flex items-center justify-between px-2 py-1.5 text-xs hover:bg-[var(--muted)] cursor-pointer group"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{layout.name}</span>
                        <span className="text-[var(--muted-foreground)] text-[10px]">
                          {layout.terminals.length} terminal{layout.terminals.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteLayout(e, layout.id)}
                        className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                      >
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile selector */}
        <select
          value={selectedProfileId || ''}
          onChange={(e) => setSelectedProfile(e.target.value || null)}
          disabled={isLoading}
          className="px-2 py-1 text-xs rounded bg-[var(--muted)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] min-w-[140px]"
        >
          <option value="">Default</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSpawn}
          className="px-3 py-1 text-xs rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          + New Terminal
        </button>
      </div>
    </div>
  )
}
