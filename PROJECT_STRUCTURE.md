# 📁 Project Structure

## Overview

This document explains the structure and organization of the DSA Teaching Studio codebase.

## Directory Structure

```
dsa-tool/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Home page (renders MainLayout)
│   │   ├── globals.css        # Global styles and Tailwind
│   │   └── favicon.ico        # App icon
│   │
│   ├── components/            # React components
│   │   ├── MainLayout.tsx     # Main app layout with header & panels
│   │   ├── CodeEditor.tsx     # Monaco-based code editor
│   │   ├── DrawingCanvas.tsx  # HTML5 canvas for drawing
│   │   ├── DrawingToolbar.tsx # Drawing tools & controls
│   │   ├── KeyboardShortcuts.tsx # Global keyboard handler
│   │   └── ShortcutsPanel.tsx    # Help panel with shortcuts
│   │
│   ├── store/                 # State management
│   │   └── useStore.ts        # Zustand store (app state)
│   │
│   └── types/                 # TypeScript definitions
│       └── index.ts           # All type definitions
│
├── public/                    # Static assets
│   └── *.svg                  # Icon files
│
├── node_modules/              # Dependencies (not in git)
│
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── eslint.config.mjs          # ESLint configuration
├── README.md                  # Main documentation
├── QUICKSTART.md              # Quick start guide
└── PROJECT_STRUCTURE.md       # This file
```

## Key Files Explained

### Application Core

#### `src/app/page.tsx`
- Entry point of the application
- Renders the MainLayout component
- Minimal - all logic is in components

#### `src/components/MainLayout.tsx`
- **Main orchestrator** of the app
- Manages view modes (split, code-only, draw-only)
- Handles panel resizing
- Contains header with controls
- Renders CodeEditor and DrawingCanvas based on view mode

### Code Editor

#### `src/components/CodeEditor.tsx`
- Integrates Monaco Editor (VS Code's editor)
- Manages multiple code files (tabs)
- Handles code execution (JavaScript/TypeScript)
- Displays console output
- Features:
  - Syntax highlighting
  - Line numbers
  - Auto-completion
  - File management (add, delete, download)
  - Run button and execution

### Drawing Canvas

#### `src/components/DrawingCanvas.tsx`
- HTML5 Canvas-based drawing surface
- Handles mouse events (draw, select, pan)
- Renders all drawing elements
- Supports:
  - Multiple drawing tools (pen, shapes, text, arrow)
  - Selection and manipulation
  - Zoom and pan
  - Element rendering with transforms

#### `src/components/DrawingToolbar.tsx`
- UI for drawing tool selection
- Color picker and styling controls
- Stroke width, fill color, opacity, line style
- Undo/Redo buttons
- Zoom controls
- Export buttons (PNG, SVG)
- Clear canvas button

### State Management

#### `src/store/useStore.ts`
- **Central state store** using Zustand
- Manages:
  - View mode state
  - Code files and active file
  - Console output
  - Drawing elements and history
  - Canvas settings (zoom, pan, colors)
  - Session management
- **All actions** for modifying state
- **LocalStorage integration** for persistence

### Type Definitions

#### `src/types/index.ts`
- TypeScript types for the entire app
- Types defined:
  - `ViewMode`: split, code-only, draw-only
  - `Language`: javascript, python, cpp, java, typescript
  - `DrawingTool`: pen, eraser, line, arrow, shapes, etc.
  - `DrawingElement`: Structure of each canvas element
  - `CodeFile`: Structure of code files
  - `ConsoleOutput`: Console log entries
  - `Session`: Saved session structure
  - `AppState`: Complete application state

### Utilities

#### `src/components/KeyboardShortcuts.tsx`
- Global keyboard event handler
- Listens for shortcuts (Ctrl+Z, Ctrl+1, etc.)
- Dispatches actions to store
- No UI - just event handling

#### `src/components/ShortcutsPanel.tsx`
- Help dialog showing all keyboard shortcuts
- Floating button in bottom-right
- Modal overlay with categorized shortcuts
- User can open/close as needed

### Styling

#### `src/app/globals.css`
- Tailwind CSS imports
- Global CSS reset
- Custom scrollbar styles (dark theme)
- Monaco Editor integration styles

## Data Flow

### 1. User Interaction Flow

```
User Action
    ↓
Component (event handler)
    ↓
Zustand Store (action)
    ↓
State Update
    ↓
Re-render Components
```

### 2. Code Execution Flow

```
User clicks "Run"
    ↓
CodeEditor.handleRun()
    ↓
Execute code in sandboxed function
    ↓
Capture console.log/error/warn
    ↓
Add to consoleOutput in store
    ↓
Display in console panel
```

### 3. Drawing Flow

```
Mouse Down on Canvas
    ↓
Create new DrawingElement
    ↓
Mouse Move
    ↓
Update element points
    ↓
Redraw canvas
    ↓
Mouse Up
    ↓
Add element to store
    ↓
Add to history stack
```

### 4. Session Save/Load Flow

```
Save:
User clicks "Save"
    ↓
Collect current state
    ↓
Create Session object
    ↓
Store in localStorage
    ↓
Add to savedSessions array

Load:
User selects session
    ↓
Read session data
    ↓
Update store with session state
    ↓
Components re-render with loaded data
```

## State Management Details

### Zustand Store Structure

```typescript
{
  // View state
  viewMode: 'split' | 'code-only' | 'draw-only'
  splitRatio: number (0.2 to 0.8)
  
  // Code editor
  codeFiles: CodeFile[]
  activeFileId: string
  editorTheme: 'vs-dark' | 'vs-light' | 'hc-black'
  fontSize: number
  
  // Console
  consoleOutput: ConsoleOutput[]
  isRunning: boolean
  
  // Drawing
  drawingElements: DrawingElement[]
  selectedElementIds: string[]
  activeTool: DrawingTool
  strokeColor: string
  strokeWidth: number
  fillColor: string
  opacity: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  canvasBackground: string
  zoom: number
  panOffset: { x, y }
  
  // History
  historyIndex: number
  history: DrawingElement[][]
  
  // Sessions
  currentSessionId: string | null
  savedSessions: Session[]
}
```

### Key Store Actions

- **View**: `setViewMode()`, `setSplitRatio()`
- **Code**: `addCodeFile()`, `updateCodeFile()`, `setActiveFile()`
- **Console**: `addConsoleOutput()`, `clearConsole()`
- **Drawing**: `addDrawingElement()`, `deleteDrawingElements()`, `setActiveTool()`
- **Canvas**: `setZoom()`, `setPanOffset()`, `setStrokeColor()`
- **History**: `undo()`, `redo()`, `addToHistory()`
- **Session**: `saveSession()`, `loadSession()`, `exportSession()`

## Component Hierarchy

```
App
└── MainLayout
    ├── KeyboardShortcuts (global)
    ├── ShortcutsPanel (floating)
    └── Main Container
        ├── Header
        │   ├── View Mode Buttons
        │   └── Session Controls
        └── Content Area (based on viewMode)
            ├── Split View:
            │   ├── CodeEditor
            │   │   ├── File Tabs
            │   │   ├── Monaco Editor
            │   │   └── Console Panel
            │   ├── Resize Handle
            │   └── DrawingArea
            │       ├── DrawingToolbar
            │       └── DrawingCanvas
            │
            ├── Code Only:
            │   └── CodeEditor (full screen)
            │
            └── Draw Only:
                ├── DrawingToolbar
                └── DrawingCanvas (full screen)
```

## Rendering Strategy

### Canvas Rendering

1. **Clear canvas** with background color
2. **Apply transforms** (zoom, pan)
3. **Render all elements** in order:
   - For each DrawingElement:
     - Set styles (color, width, opacity)
     - Draw based on type (pen, line, shape)
     - Draw selection indicator if selected
4. **Render current element** being drawn
5. **Restore transform**

### Code Editor Rendering

- Monaco Editor handles its own rendering
- We only manage:
  - File tabs switching
  - Console output list
  - Toolbar button states

## Performance Considerations

### Drawing Canvas
- **Redraw only when needed** (elements change, zoom, pan)
- **Use canvas transform** instead of recalculating coordinates
- **History limited** to 50 states to prevent memory issues

### Code Editor
- **Monaco handles performance** internally
- **Console output** appends items (no full re-render)
- **Auto-scroll** to latest console output

### State Updates
- **Zustand** only re-renders components that use changed state
- **Deep cloning** for history to prevent reference issues
- **Throttled saves** to localStorage (on demand, not on every change)

## Extension Points

### Adding New Drawing Tools

1. Add tool type to `DrawingTool` in `types/index.ts`
2. Add tool button to `DrawingToolbar.tsx`
3. Add rendering logic in `DrawingCanvas.drawElement()`
4. Add mouse handling in `DrawingCanvas` event handlers

### Adding Language Support

1. Add language to `Language` type in `types/index.ts`
2. Add execution logic in `CodeEditor.handleRun()`
3. (For full support, would need backend execution)

### Adding View Modes

1. Add mode to `ViewMode` type
2. Add button in `MainLayout` header
3. Add rendering case in `MainLayout` content area

## Testing Strategy (Future)

### Unit Tests
- Store actions and state updates
- Drawing element creation and manipulation
- Code execution sandbox

### Component Tests
- User interactions (click, type, draw)
- Keyboard shortcuts
- Session save/load

### Integration Tests
- Full workflow: code → run → draw → save → load
- Export functionality
- Multi-file management

## Build & Deployment

### Development
```bash
npm run dev
```
- Runs on `localhost:3000`
- Hot reload enabled
- Source maps for debugging

### Production Build
```bash
npm run build
npm start
```
- Optimized bundle
- Static generation where possible
- Production-ready assets

### Deployment Options
- **Vercel**: Native Next.js platform (recommended)
- **Netlify**: Static export
- **Docker**: Containerized deployment
- **Self-hosted**: Node.js server

## Security Considerations

### Code Execution
- JavaScript runs in browser sandbox
- **No eval() of user input** - we use Function constructor with limited scope
- **No access to filesystem** or sensitive APIs
- For full security, server-side execution needed (Phase 3)

### Data Storage
- Sessions stored in **localStorage** only
- No server-side storage in MVP
- Users control their own data
- Clear browser data = lost sessions (export recommended)

### XSS Prevention
- React escapes user input by default
- Monaco Editor handles code safely
- Canvas text rendering doesn't execute HTML

## Future Architecture Considerations

### Phase 2+
- Add backend API for:
  - Multi-language code execution
  - Session storage in database
  - User authentication
  - Collaboration features

### Recommended Stack Evolution
- **Backend**: Node.js + Express or Next.js API routes
- **Database**: PostgreSQL or MongoDB for sessions
- **Real-time**: Socket.io or WebSockets for collaboration
- **Auth**: NextAuth.js or Firebase Auth
- **Storage**: S3 or similar for session exports

## Contributing Guidelines

When adding features:

1. **Add types** in `types/index.ts` first
2. **Update store** in `useStore.ts` with actions
3. **Create/modify components** as needed
4. **Add to layout** if it's a new view
5. **Document** in README and this file
6. **Test manually** with dev server
7. **No linting errors** before committing

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**Last Updated**: October 2025

For questions or clarifications, refer to README.md or open an issue.

