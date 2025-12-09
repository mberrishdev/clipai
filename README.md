# clipai

A modern clipboard history manager built with Electron, React, and Bun. Runs in your macOS menu bar with a beautiful transparent UI.

## Features

- **Automatic Clipboard Monitoring** - Captures all clipboard text automatically
- **Transparent UI** - Beautiful frosted glass effect (toggleable)
- **Menu Bar App** - Runs in background, accessible from system tray
- **Settings** - Customize transparency and other options
- **Fast** - Built with Bun for lightning-fast performance
- **In-Memory Storage** - Clipboard history stored in memory (clears on restart)

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **Bun** - JavaScript runtime and bundler
- **TypeScript** - Type safety
- **Vite** - Frontend tooling

## Project Structure

```
src/
├── main/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script (IPC bridge)
│   └── clipboardManager.ts  # Clipboard monitoring logic
└── renderer/
    ├── pages/
    │   ├── ClipboardHistory.tsx  # Main clipboard history view
    │   ├── ClipboardHistory.css
    │   ├── Settings.tsx          # Settings page
    │   └── Settings.css
    ├── main.tsx             # React entry point
    ├── App.tsx              # Main app component with routing
    └── types.d.ts           # TypeScript definitions
```

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- macOS (for menu bar features)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clipai.git
cd clipai
```

2. Install dependencies:
```bash
bun install
```

## Development

Start the development server:

```bash
bun run dev
```

This will:
- Start Vite dev server for the renderer (React UI)
- Compile the preload script in watch mode
- Launch Electron app

## Build

Build for production:

```bash
bun run build
```

This creates:
- `dist/renderer/` - Built React app
- `dist/main/` - Compiled Electron main process

## Usage

### Menu Bar
- Click the tray icon to show/hide the window
- Right-click for menu options:
  - **Show Clipboard History** - View all copied items
  - **Settings** - Configure app preferences
  - **Quit** - Exit the application

### Settings
- **Window Transparency** - Toggle transparent/opaque background

### Clipboard History
- Automatically saves all clipboard text
- Ignores empty or whitespace-only entries
- Clears when app is restarted

## Scripts

- `bun run dev` - Start development mode
- `bun run dev:renderer` - Start Vite dev server only
- `bun run dev:preload` - Build preload script
- `bun run dev:electron` - Start Electron only
- `bun run build` - Build for production
- `bun run build:renderer` - Build React app
- `bun run build:main` - Build main process
- `bun run build:preload` - Build preload script

## License

MIT
