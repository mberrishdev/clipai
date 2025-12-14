# clipai

[![Release](https://img.shields.io/github/v/release/mberrishdev/clipai)](https://github.com/mberrishdev/clipai/releases)
[![Issues](https://img.shields.io/github/issues/mberrishdev/clipai)](https://github.com/mberrishdev/clipai/issues)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern clipboard history manager built with Electron, React, and Bun. Runs in your system tray (macOS menu bar / Windows taskbar) with a beautiful transparent UI.

![clipai screenshot](assets/screen1.png)

## Features

- **Automatic Clipboard Monitoring** - Captures clipboard text and images automatically
- **Image Support** - Save and preview screenshots and copied images
- **Smart Content Detection** - Detects JSON, URLs, colors, emails, and base64
- **Syntax Highlighting** - Beautiful JSON formatting with syntax highlighting
- **Transparent UI** - Beautiful frosted glass effect (toggleable)
- **System Tray App** - Runs in background, accessible from system tray
- **Cross-Platform** - Works on macOS and Windows
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
│   ├── clipboardManager.ts  # Clipboard monitoring logic
│   ├── database.ts          # SQLite database manager
│   └── configManager.ts     # App configuration management
├── renderer/
│   ├── pages/
│   │   ├── ClipboardHistory.tsx  # Main clipboard history view
│   │   ├── ClipboardHistory.css
│   │   ├── Settings.tsx          # Settings page
│   │   └── Settings.css
│   ├── components/
│   │   └── ClipboardItem.tsx     # Individual clipboard item component
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app component with routing
│   └── types.d.ts           # TypeScript definitions
└── models/
    └── ClipboardItem.ts     # Data models and interfaces
```

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- macOS or Windows

## Installation

### From Release (Recommended)

Download the latest release from the [Releases page](https://github.com/mberrishdev/clipai/releases).

**macOS Users:**

1. Download the `.dmg` file (choose `arm64` for Apple Silicon or `x64` for Intel Macs)
2. Open the `.dmg` file
3. Drag clipai to your Applications folder
4. **Important:** Remove macOS quarantine (required for unsigned apps)

   Open Terminal and run:
   ```bash
   xattr -cr /Applications/clipai.app
   ```

   This is safe - it just removes the quarantine flag that macOS adds to downloaded files. Required because the app is not code-signed.

5. Launch clipai from Applications

**Alternative method if you see "unidentified developer" warning:**
- Right-click (or Control-click) on clipai in Applications
- Click "Open"
- Click "Open" again in the dialog

**Note:** If you see "app is damaged and can't be opened", you must use the Terminal command above.

**Windows Users:**

You may see a Windows SmartScreen warning because the app is not code-signed. This is normal for open-source apps. To install:

1. Download the `.exe` installer
2. Run the installer
3. If you see a SmartScreen warning:
   - Click "More info"
   - Click "Run anyway"

**Note:** These warnings appear because the app doesn't have a commercial code signing certificate ($300-400/year). The app is completely safe and open-source.

### From Source

1. Clone the repository:
```bash
git clone https://github.com/mberrishdev/clipai.git
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

Package the app:

```bash
bun run package
```

Creates platform-specific installers in `release/`:
- **macOS**: `.dmg` and `.zip` files (Intel x64 and Apple Silicon arm64)
- **Windows**: `.exe` installer (NSIS) and portable `.exe`

## Usage

### System Tray
- **macOS**: Look for the icon in the menu bar (top-right)
- **Windows**: Look for the icon in the system tray (bottom-right, notification area)
- Click the tray icon to show/hide the window
- Right-click (or left-click on Windows) for menu options:
  - **Show Clipboard History** - View all copied items
  - **Settings** - Configure app preferences
  - **Quit** - Exit the application

### Settings
- **Window Transparency** - Toggle transparent/opaque background

### Clipboard History
- Automatically saves all clipboard text and images
- Smart detection: JSON, URLs, colors, emails
- Click URLs to open in default browser
- Click items to copy back to clipboard
- Ignores empty or whitespace-only entries
- Persistent storage using SQLite database
- Load more history with pagination

## Logs

**macOS:**
```bash
~/Library/Logs/clipai/main.log

# Open in default editor
open ~/Library/Logs/clipai/main.log

# Tail logs in real-time
tail -f ~/Library/Logs/clipai/main.log
```

**Windows:**
```
C:\Users\<YourUsername>\AppData\Roaming\clipai\logs\main.log
```

To open the logs folder:
```cmd
# Open in File Explorer
explorer %APPDATA%\clipai\logs

# Open log file directly in Notepad
notepad %APPDATA%\clipai\logs\main.log

# View in Command Prompt
type %APPDATA%\clipai\logs\main.log
```

**Note:** If the logs folder doesn't exist, the app may not have been launched yet, or electron-log may not have initialized. Launch the app once and the log file will be created automatically.

## Scripts

- `bun run dev` - Start development mode
- `bun run dev:renderer` - Start Vite dev server only
- `bun run dev:preload` - Build preload script
- `bun run dev:electron` - Start Electron only
- `bun run build` - Build for production
- `bun run build:renderer` - Build React app
- `bun run build:main` - Build main process
- `bun run build:preload` - Build preload script
- `bun run package` - Package app for distribution
- `bun run package:dir` - Package without creating installer (faster for testing)

## License

MIT
