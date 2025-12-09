# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

clipai is a macOS clipboard history manager built as an Electron app. It runs as a menu bar (system tray) application that monitors clipboard changes and displays them in a React-based UI.

## Architecture

### Three-Process Model
This is a standard Electron app with three distinct processes:

1. **Main Process** (`src/main/main.ts`)
   - Manages Electron lifecycle, window creation, and system tray
   - Owns the ClipboardManager instance
   - Handles IPC communication from renderer
   - Cannot access DOM or React

2. **Preload Script** (`src/main/preload.ts`)
   - Bridges main and renderer processes securely via `contextBridge`
   - Exposes safe IPC methods to renderer as `window.electronAPI`
   - Must be compiled to CommonJS before Electron can load it

3. **Renderer Process** (`src/renderer/`)
   - React app running in Electron's BrowserWindow
   - Uses IPC to communicate with main process
   - No direct access to Node.js or Electron APIs (security)

### Key Components

**ClipboardManager** (`src/main/clipboardManager.ts`)
- Polls system clipboard every 500ms using Electron's `clipboard` API
- Stores history in memory (clears on app restart)
- Filters out empty/whitespace-only entries
- Sends updates to renderer via IPC

**Routing** (`src/renderer/App.tsx`)
- Simple page-based routing (no react-router)
- Two pages: ClipboardHistory and Settings
- Navigation triggered via IPC from tray menu or UI buttons

**Transparency System**
- Window created with `transparent: true` and `frame: false`
- CSS classes (`transparent`/`opaque`) toggle background opacity
- Cannot change window transparency dynamically without recreating window

## Development Commands

### Run Development Server
```bash
bun run dev
```
This runs three processes concurrently:
- Vite dev server for renderer (React UI) on http://localhost:5173
- Preload script builder in watch mode
- Electron app pointing to dev server

### Build for Production
```bash
bun run build
```
Creates:
- `dist/renderer/` - Built React app
- `dist/main/` - Compiled main process
- `src/main/preload.js` - Compiled preload (during dev)

### Individual Build Commands
```bash
bun run build:renderer  # Vite build
bun run build:main      # Bun build main.ts
bun run build:preload   # Bun build preload.ts
```

## Important Constraints

### Preload Script Compilation
The preload script MUST be compiled to CommonJS before Electron can load it. This happens via `scripts/build-preload.ts` which uses Bun's builder with:
```typescript
{
  format: 'cjs',
  external: ['electron'],  // Critical: don't bundle Electron
}
```

### ES Modules in Electron Main Process
Since `package.json` has `"type": "module"`, the main process uses ESM:
- Use `import.meta.url` instead of `__dirname`
- Import statements must include `.ts` extension: `import { X } from './file.ts'`
- No `require()` available

### IPC Communication Pattern
Main → Renderer: `win.webContents.send('event-name', data)`
Renderer → Main: `ipcRenderer.invoke('handler-name', data)`

All IPC must go through preload script's `contextBridge.exposeInMainWorld()`.

### Vite Configuration
Vite is configured with `root: './src/renderer'`, so all renderer files must be in that directory. Build output goes to `dist/renderer/`.

## Bun Usage

Default to using Bun instead of Node.js:
- `bun install` instead of `npm install`
- `bun run <script>` instead of `npm run <script>`
- ES modules are the default (`"type": "module"` in package.json)
- No need for dotenv - Bun automatically loads .env files

## Window Management

The app is designed as a menu bar utility:
- Window hidden by default (`show: false`)
- Closing window hides it instead of quitting (`event.preventDefault()`)
- App only quits when user selects "Quit" from tray menu
- `isQuitting` flag prevents hide-on-close when actually quitting
- me