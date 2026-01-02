# CLAUDE.md - TabzCanvas

## Overview

An **infinite canvas workspace for terminals** - a companion app to TabzChrome that provides a spatial environment for arranging terminal sessions.

| | |
|--|--|
| **Architecture** | React SPA connecting to TabzChrome backend |
| **Philosophy** | Spatial terminal organization - drag, resize, pan, zoom |
| **Port** | Dev server on `localhost:5174`, connects to TabzChrome on `8129` |

---

## Architecture

```
src/
├── App.tsx                      # Canvas pan/zoom viewport
├── main.tsx                     # React entry point
├── index.css                    # Tailwind v4 styles
├── stores/
│   └── canvasStore.ts           # Zustand state (terminals, viewport)
└── components/
    ├── CanvasTerminal.tsx       # xterm.js terminal with drag/resize
    └── Toolbar.tsx              # Canvas controls
```

**Key patterns:**
- **Canvas viewport**: Transform-based pan/zoom with mouse wheel and drag
- **Terminal cards**: Draggable/resizable containers with xterm.js
- **Backend connection**: REST API for spawn, WebSocket for terminal I/O
- **State persistence**: Zustand with localStorage (survives reload)

---

## Tech Stack

- **React 19** + **Vite 7** + **TypeScript**
- **Tailwind CSS v4** (Vite plugin, CSS variables)
- **Zustand** for state management
- **xterm.js** for terminal rendering
- **TabzChrome backend** (port 8129) for PTY/tmux

---

## Development

### Commands
```bash
npm run dev       # Start dev server (port 5174)
npm run build     # Production build
npm run lint      # ESLint check
```

### Prerequisites
- TabzChrome backend must be running on port 8129
- Start backend: `cd ~/projects/TabzChrome && ./scripts/dev.sh`

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Ctrl+N | Spawn new terminal |
| Ctrl+0 | Reset view (center, zoom 100%) |
| Mouse wheel | Zoom in/out |
| Click+drag canvas | Pan |
| Click+drag header | Move terminal |
| Drag corner | Resize terminal |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Canvas viewport with pan/zoom handlers |
| `src/stores/canvasStore.ts` | Terminal state, viewport position, Zustand persist |
| `src/components/CanvasTerminal.tsx` | xterm.js integration, WebSocket connection |
| `src/components/Toolbar.tsx` | Canvas controls (spawn, reset view) |
| `vite.config.ts` | Dev server config (port 5174) |

---

## Beads Workflow

This project uses **bd** (beads) for issue tracking.

### Quick Reference
```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd create             # Create new issue (interactive)
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

### Landing the Plane (Session Completion)

When ending a work session, complete ALL steps:

1. **File issues for remaining work** - `bd create` for follow-ups
2. **Run quality gates** - `npm run build && npm run lint`
3. **Update issue status** - `bd close <id>` for finished work
4. **PUSH TO REMOTE**:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** - All changes committed AND pushed

**CRITICAL:** Work is NOT complete until `git push` succeeds.

---

## TabzChrome Integration

This project connects to the TabzChrome backend on port 8129.

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `POST /api/spawn` | Create terminal (auth required) |
| `GET /api/agents` | List active terminals |
| `DELETE /api/agents/:id` | Kill terminal |
| `GET /api/health` | Health check (no auth) |
| `GET /api/auth-token` | Get auth token |

### Authentication
```bash
TOKEN=$(cat /tmp/tabz-auth-token)
curl -H "X-Auth-Token: $TOKEN" ...
```

### WebSocket Protocol
Connect to `ws://localhost:8129?sessionId=xxx&token=xxx`

Message types: `input`, `output`, `resize`, `spawn`, `kill`

### Skills to Use
When working on this project, use these skills:
- **xterm-js** - Terminal implementation, resize handling, WebSocket patterns
- **tabz-mcp** - MCP browser automation tools
- **tabz-guide** - TabzChrome feature reference

These are available at user level - just reference them when relevant.

---

## AI Assistant Notes

### When Making Changes
1. Test with TabzChrome backend running
2. Check canvas interactions (pan, zoom, drag, resize)
3. Verify terminal connects and receives output
4. Run `npm run build` before committing

### Key Constraints
- Must connect to TabzChrome backend (port 8129)
- Keep dependencies minimal
- Follow TabzChrome patterns for terminal handling
