# TabzCanvas Roadmap

## Phase 1 - Core Canvas (Current)

- [x] Pan/zoom canvas with transform
- [x] Grid background that scales with zoom
- [x] Draggable terminal cards
- [x] Resizable terminal cards
- [x] xterm.js integration
- [x] Connect to TabzChrome backend via WebSocket
- [x] Zustand state with persistence
- [x] Keyboard shortcuts (Ctrl+N spawn, Ctrl+0 reset)
- [ ] Terminal title editing
- [ ] Multiple terminal profiles

---

## Phase 2 - Integration

- [ ] **Send to Canvas from TabzChrome sidebar**
  - Button in sidebar to pop terminal out to canvas
  - Transfer session without reconnecting

- [ ] **Send to Sidebar from canvas**
  - Button on canvas terminal to move back to sidebar
  - Maintain session continuity

- [ ] **Shared terminal state**
  - Canvas and sidebar see same terminals
  - Real-time sync via backend

---

## Phase 3 - Enhanced Features

- [ ] **File viewer cards**
  - Drag files onto canvas
  - Syntax-highlighted code view
  - Markdown preview

- [ ] **Drawing layer**
  - Arrows between cards
  - Text annotations
  - Shapes (rectangles, circles)
  - Freehand drawing

- [ ] **Layout save/restore**
  - Named layouts
  - Quick switch between layouts
  - Export/import layouts

- [ ] **Mini-map**
  - Overview of entire canvas
  - Click to navigate

---

## Phase 4 - MCP Tools

- [ ] **opus_spawn_terminal**
  - Spawn terminal at specific canvas position
  - Set initial command/profile

- [ ] **opus_pan_canvas**
  - Programmatically move viewport
  - Focus on specific terminal

- [ ] **opus_open_file**
  - Open file viewer card at position
  - Support images, markdown, code

- [ ] **opus_draw_arrow**
  - Connect two cards with arrow
  - Optional label

- [ ] **opus_get_layout**
  - Return current terminal positions
  - Include viewport state

---

## Future Ideas

- **Collaboration** - Multiple users on same canvas
- **Templates** - Pre-arranged layouts for common workflows
- **History** - Undo/redo canvas operations
- **Search** - Find terminals by name/content
- **Grouping** - Select multiple cards, move together
- **Snapping** - Align cards to grid or each other
