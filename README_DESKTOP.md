# GPX Adjuster Desktop Application

This document describes how to run the GPX Adjuster as a native macOS desktop application using Tauri.

## Prerequisites

- Node.js and npm installed
- Rust toolchain installed (https://rustup.rs/)
- Xcode Command Line Tools (for macOS builds)

## Development

To run the desktop application in development mode:

```bash
npm install
npm run desktop:dev
```

This will:
1. Start the Next.js development server on http://localhost:3000
2. Launch the Tauri desktop application that loads the web content

## Production Build

To create a production desktop application:

```bash
npm run export
npm run desktop:build
```

This will:
1. Build and export the Next.js application to static files in `./out`
2. Bundle those files into a native macOS application
3. Generate a `.app` file and `.dmg` installer in `src-tauri/target/release/bundle/`

## Architecture

- **Development**: Tauri loads `http://localhost:3000` (Next.js dev server)
- **Production**: Tauri bundles static files from `./out` directory
- **Configuration**: See `tauri.conf.json` for app settings
- **Rust Backend**: Minimal Tauri setup in `src-tauri/` directory

## Available Scripts

- `npm run desktop:dev` - Start desktop app in development mode
- `npm run desktop:build` - Build production desktop app
- `npm run export` - Export Next.js to static files (used by desktop build)