# Tabz Canvas

Infinite canvas workspace for terminals, powered by TabzChrome's backend.

## Features

- **Infinite Canvas** - Pan and zoom with mouse/trackpad
- **Draggable Terminals** - Position terminals anywhere on the canvas
- **Resizable** - Drag corners to resize terminals
- **TabzChrome Integration** - Connects to TabzChrome backend (port 8129)

## Quick Start

```bash
# Make sure TabzChrome backend is running first
cd ~/projects/TabzChrome && ./scripts/dev.sh

# Then start the canvas
cd ~/projects/tabz-canvas
npm install
npm run dev
```

Open http://localhost:5174

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Spawn new terminal |
| `Ctrl+0` | Reset view (zoom 100%, center) |
| `Mouse wheel` | Zoom in/out |
| `Click + drag` | Pan canvas |

## Architecture

```
tabz-canvas (port 5174)          TabzChrome backend (port 8129)
┌─────────────────────────┐      ┌─────────────────────────────┐
│  React + Vite           │      │  Express + WebSocket        │
│  ├── Canvas pan/zoom    │ ────►│  ├── /api/spawn             │
│  ├── Terminal wrappers  │      │  ├── /api/terminals         │
│  └── xterm.js           │◄────►│  └── WebSocket I/O          │
└─────────────────────────┘      └─────────────────────────────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │  tmux + PTY   │
                                  └───────────────┘
```

## Development

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run preview # Preview production build
```

## Requirements

- Node.js 18+
- TabzChrome backend running on port 8129
