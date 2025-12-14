# Release Guide

## How to Publish a New Release

### 1. Update version
```bash
npm version patch --no-git-tag-version
```
- `patch`: 0.0.4 → 0.0.5 (bug fixes)
- `minor`: 0.0.4 → 0.1.0 (new features)
- `major`: 0.0.4 → 1.0.0 (breaking changes)

### 2. Update CHANGELOG.md
Add your changes under a new version section.

### 3. Commit changes
```bash
git add .
git commit -m "v0.0.5 - Description of changes"
```

### 4. Push to master
```bash
git push
```

### 5. Create and push tag
```bash
git tag v0.0.5
git push origin v0.0.5
```

### 6. Monitor build
- Go to: https://github.com/mberrishdev/clipai/actions
- Wait for "Release" workflow to complete (~10-15 min)

### 7. Check release
- Go to: https://github.com/mberrishdev/clipai/releases
- Download artifacts:
  - macOS: `.dmg` and `.zip`
  - Windows: `.exe`

## Quick Release (One-liner)
```bash
npm version patch && git push && git push --tags
```
Note: This only works if you have no uncommitted changes.
