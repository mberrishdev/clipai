# Changelog

All notable changes to this project will be documented in this file.

## [0.0.9] – 2025-12-16

### Added
- File handling support: Clipboard manager and UI now handle file drops and file-type clipboard entries.
- Image viewer: You can now open images directly from clipboard history.
- Archive functionality: Archive clipboard items with retention period management and new UI for archived items.

### Changed
- Enhanced UI styles: Improved backdrop filters and shadows for better visibility and aesthetics.
- Improved window behavior on macOS: Window now centers on the display where the shortcut is triggered and behaves more naturally with multiple monitors/spaces.

## [0.0.8] - 2024-12-15

### Added
- `,` key shortcut to open Settings from clipboard history
- Updated keyboard hints to show all available shortcuts

## [0.0.7] - 2024-12-15

### Added
- Enter key opens URLs in browser (instead of copying)
- C key always copies selected item

### Fixed
- Clipboard history now saves items even without OpenAI API key configured
- Items without API key save with empty embedding (semantic search disabled until key added)

### Changed
- macOS builds now arm64 only (removed Intel x64)

## [0.0.6] - 2024-12-14

### Added
- Keyboard navigation for clipboard history
  - ↑/↓ arrows to navigate items
  - Enter or C to copy selected item
  - / to focus search input
  - Escape to unfocus search
- Visual highlight for selected item
- Keyboard hints in search bar
- Release script for easier publishing

## [0.0.5] - 2024-12-14

### Added
- Check for Updates menu item - manually check for new releases
- View Logs menu item - open log file for debugging
- Version display in tray menu
- Error dialog when app fails to start

### Fixed
- Release workflow - disabled electron-builder auto-publish

## [0.0.4] - 2024-12-14

### Added
- GitHub Actions release workflow for automated builds
- macOS (arm64, x64) and Windows (x64) builds
- sqlite-vec support for semantic search

### Fixed
- Native module loading in packaged apps (asar path fix)

## [0.0.3] - 2024-12-13

### Added
- Keyboard shortcut recorder for custom shortcuts
- Settings page improvements
- OpenAI API key configuration

## [0.0.2] - 2024-12-12

### Added
- Semantic search with OpenAI embeddings
- Clipboard history with SQLite storage

## [0.0.1] - 2024-12-11

### Added
- Initial release
- Menu bar tray app
- Clipboard monitoring
- Basic history view
