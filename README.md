# 🏔️ GPX Elevation Editor

<div align="center">

**A powerful, browser-based GPX elevation profile editor with anomaly detection and advanced smoothing capabilities**

### 🚀 [**Try it now at elevationeditor.com**](https://elevationeditor.com) 🚀

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<a href="https://www.producthunt.com/products/gpx-elevation-editor?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-gpx&#0045;elevation&#0045;editor" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1033849&theme=light&t=1762156288094" alt="GPX&#0032;Elevation&#0032;Editor - Edit&#0032;&#0038;&#0032;analyze&#0032;gpx&#0032;elevation&#0032;profiles&#0032;online | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

[Live Demo](https://elevationeditor.com) · [Report Bug](https://github.com/petrnomad/GPX-Elevation-Editor/issues) · [Request Feature](https://github.com/petrnomad/GPX-Elevation-Editor/issues)

</div>

---

## 📖 About

Elevation Editor is a modern, fully client-side web application for analyzing and editing GPX files. Built with Next.js and TypeScript, it provides professional-grade tools for fixing GPS elevation data, detecting anomalies, and smoothing elevation profiles.

**✨ Key Highlights:**
- 🔒 **100% Privacy** - All processing happens in your browser, no data leaves your device
- 🎨 **Modern UI** - Beautiful interface with light/dark mode support
- 🚀 **Fast & Responsive** - Optimized for desktop and tablet devices
- 🛠️ **Professional Tools** - Advanced algorithms for anomaly detection and smoothing
- 📊 **Detailed Analytics** - Comprehensive statistics and interactive charts
- ⌨️ **Keyboard Shortcuts** - Efficient workflow with hotkeys
- 🗺️ **Interactive Map** - Visualize your route with Leaflet integration

---

## 🤔 Why This Project Exists

If you've ever worked with GPX files from hiking trails, you know the problem. GPS signals on phones aren't perfect – walk under an overhang, through a tunnel, or past a tall rock, and the recorded elevation starts jumping like on a trampoline. Suddenly you have spikes of tens of meters up or down in your data that simply don't belong there.

When you then edit such a GPX file in common editors (like the otherwise excellent GPX Studio), these tools often recalculate elevation data based on their maps. The result? On a route that actually has 500 meters of elevation gain, it suddenly shows 700. Or 300. Numbers that have nothing to do with reality.

As the maintainer of [MadeiraJourney.com](https://madeirajourney.com), where I publish detailed guides for Madeira hiking trails, I dealt with this problem daily. I needed a tool that would allow me to easily fix elevation anomalies in GPX files – manually, visually, with full control over the result.

### What Elevation Editor Does

**Elevation Editor** is a web tool for fixing elevation data in GPX files. It allows you to:

- **Visually edit elevation profiles** – simply drag chart points with your mouse to where they should be
- **Automatically detect anomalies** – the algorithm finds suspicious jumps in elevation data
- **Smooth profiles** – various smoothing levels to remove minor inaccuracies
- **View route on map** – see exactly where each part of the elevation profile is located
- **Preserve original GPS data** – only elevations are edited, GPS coordinates remain untouched

### Main Advantages

✅ **Runs directly in browser** – no installation, no dependencies
✅ **100% private** – data isn't sent anywhere, everything is processed locally
✅ **Fast and intuitive** – drag & drop to upload files, mouse drag to edit
✅ **Export to GPX** – download your edited file back in standard format

### Who Is This Tool For

Let's be honest – this is an extremely specialized tool. You'll find it useful if you:

- Maintain a hiking trail website and need accurate elevation data
- Create trail guides or maps and want to publish correct information
- Are a data perfectionist and inaccuracies in your GPX records bother you
- Analyze performance data from running/cycling and need to fix GPS errors

If you don't fall into any of these categories, you'll probably never use this tool. And that's okay. It was created because I needed it, and if it helps a few other people, I'll be happy.

---

## 🎯 Features

### 📈 Elevation Profile Editing
- **Click-to-Edit** - Directly modify elevation values by clicking on the chart
- **Drag Editing** - Smooth elevation adjustments by dragging across multiple points
- **Undo/Redo** - Full history support with up to 100 undo levels
- **Smart Smoothing** - Configurable smoothing with radius and strength controls
- **Real-time Preview** - See changes instantly as you edit

### 🔍 Anomaly Detection
- **Automatic Detection** - Identifies unusual elevation spikes and GPS errors
- **Configurable Threshold** - Adjust sensitivity from 5m to 200m
- **Visual Highlighting** - Anomalies marked with red overlays on the chart
- **One-Click Dismiss** - Ignore false positives with a single click
- **Smart Algorithms** - Gradient-based detection with severity scoring

### 📊 Statistics & Analytics
- **Elevation Stats** - Min, max, total ascent/descent
- **Distance Tracking** - Total distance with accurate calculations
- **Speed Analysis** - Average and maximum speed (if time data available)
- **Duration** - Total time for activities with timestamps
- **Unit Support** - Switch between metric (m, km) and imperial (ft, mi)
- **Edited Points Tracking** - See how many points you've modified

### 🗺️ Interactive Map
- **Route Visualization** - Display your GPS track on OpenStreetMap
- **Toggle View** - Show/hide map with keyboard shortcut (⌘M)
- **Leaflet Integration** - Smooth, responsive map experience

### 🎨 User Experience
- **Dark Mode** - Eye-friendly theme that adapts to your system
- **Zoom & Pan** - Navigate large routes with ease
  - Mouse wheel zoom (⌘ + scroll)
  - Click-and-drag panning (⌘ + drag)
  - Zoom controls (+/-/Reset)
  - Pan controls (←/→)
- **Keyboard Shortcuts** - Work faster with hotkeys
  - `⌘Z` - Undo last change
  - `⌘O` - Load GPX file
  - `⌘D` - Download modified GPX
  - `⌘S` - Toggle original elevation overlay
  - `⌘M` - Toggle map view
  - `⌘A` - Toggle anomaly detection
  - `⌘I` - Toggle metric/imperial units
- **Responsive Design** - Optimized for desktop and tablet
- **Sample Data** - Try the app immediately with included sample.gpx

### 💾 Import & Export
- **GPX Support** - Full GPX 1.1 format compatibility
- **Drag & Drop** - Easy file loading with drag-and-drop
- **Metadata Preservation** - Keeps all original data (timestamps, coordinates)
- **Selective Updates** - Only elevation data is modified
- **Original Overlay** - Compare edited vs original elevation profiles

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** or **pnpm**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/petrnomad/GPX-Elevation-Editor.git
   cd GPX-Elevation-Editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (outputs to `/out`)
- `npm run preview` - Preview production build locally

---

## 📁 Project Structure

```
elevation-editor/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # Root layout with theme provider
│   └── globals.css               # Global styles
├── components/
│   ├── elevation-editor.tsx      # Main editor component
│   ├── elevation-editor/
│   │   ├── algorithms/           # Core algorithms
│   │   │   ├── anomaly-detection.ts
│   │   │   ├── smoothing.ts
│   │   │   └── statistics.ts
│   │   ├── components/           # UI components
│   │   │   ├── ChartCard.tsx
│   │   │   ├── ControlsCard.tsx
│   │   │   ├── ElevationChart.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── ...
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useZoomPan.ts
│   │   │   ├── useElevationHistory.ts
│   │   │   ├── useChartInteractions.ts
│   │   │   └── ...
│   │   ├── utils/                # Utility functions
│   │   ├── constants.ts          # Configuration constants
│   │   └── types.ts              # TypeScript types
│   ├── elevation-map.tsx         # Leaflet map component
│   ├── footer.tsx                # Footer with info & links
│   ├── gpx-upload.tsx            # File upload component
│   ├── theme-provider.tsx        # Theme context provider
│   ├── theme-toggle.tsx          # Dark mode toggle
│   └── ui/                       # Radix UI & shadcn/ui components
├── lib/
│   ├── gpx-parser.ts             # GPX parsing & export
│   └── utils.ts                  # General utilities
├── public/
│   └── sample.gpx                # Sample GPX file
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

---

## 🛠️ Technology Stack

### Core Framework
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://reactjs.org/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development

### UI & Styling
- **[Tailwind CSS 3](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful component library
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management

### Data Visualization
- **[Recharts](https://recharts.org/)** - Chart library for React
- **[Leaflet](https://leafletjs.com/)** - Interactive maps
- **[React Leaflet](https://react-leaflet.js.org/)** - React wrapper for Leaflet

### Data Processing
- **[fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)** - GPX file parsing
- **[date-fns](https://date-fns.org/)** - Date/time utilities

### Development
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[ESLint](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS processing

---

## 🧮 Algorithms

### Anomaly Detection
The anomaly detection algorithm identifies unusual elevation changes using:
- **Gradient Analysis** - Calculates elevation change per meter
- **Threshold Detection** - Configurable sensitivity (5m to 200m)
- **Severity Scoring** - Ranks anomalies by severity
- **Region Grouping** - Combines nearby steep sections
- **Adaptive Thresholds** - Adjusts to terrain (3x average gradient)

### Smoothing
Two smoothing modes available:
1. **Click Smoothing** - Local smoothing at clicked point using Gaussian weights
2. **Drag Smoothing** - Real-time smoothing across dragged range

Both use:
- Configurable radius (1-20 points)
- Adjustable strength (0.1-1.0)
- Gaussian weighting for natural transitions

### Statistics
- **Rolling Median** - 3-point median filter reduces GPS noise
- **Elevation Gain/Loss** - Ignores changes < 2.5m (GPS noise threshold)
- **Distance Calculation** - Haversine formula for accuracy
- **Speed Analysis** - Calculated from timestamps and distance

---

## 🎮 Usage Guide

### Basic Workflow

1. **Load GPX File**
   - Drag & drop a .gpx file onto the editor
   - Or use `⌘O` keyboard shortcut
   - Sample file loads automatically on first visit

2. **Analyze Elevation**
   - Review statistics in the stats card
   - Check anomalies (red highlighted regions)
   - Compare with original elevation (toggle with `⌘S`)

3. **Edit Elevation**
   - Click on chart to adjust single points
   - Drag across multiple points for smooth edits
   - Use undo (`⌘Z`) if needed

4. **Fine-tune with Smoothing**
   - Adjust smoothing radius (1-20 points)
   - Set smoothing strength (0.1-1.0)
   - Apply smoothing by dragging or clicking

5. **Export Result**
   - Download modified GPX with `⌘D`
   - Original metadata is preserved
   - Only elevation values are updated

### Tips & Tricks

- **Zoom for Precision** - Use `⌘ + scroll` to zoom into specific sections
- **Panning** - Hold `⌘` and drag to pan through the chart
- **Anomaly Threshold** - Start with 10m, adjust up for real terrain features
- **Smoothing Radius** - Larger radius = smoother transitions
- **Ignore Anomalies** - Click X button to dismiss false positives
- **Keyboard Shortcuts** - View all shortcuts in the help card

---

## 🌐 Deployment

### Static Export

The app is pre-configured for static export:

```bash
npm run build
```

This generates optimized static files in the `/out` directory, ready for deployment to:
- **GitHub Pages**
- **Netlify**
- **Vercel**
- **Cloudflare Pages**
- **AWS S3 + CloudFront**
- Any static hosting service

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/petrnomad/GPX-Elevation-Editor)

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/petrnomad/GPX-Elevation-Editor)

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Petr Novák**

- Website: [petrnovak.com](https://petrnovak.com/)
- Email: [jsem@petrnovak.com](mailto:jsem@petrnovak.com)

---

## 🙏 Acknowledgments

- Built with ❤️ for [MadeiraJourney.com](https://madeirajourney.com)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Maps powered by [OpenStreetMap](https://www.openstreetmap.org/)
- Icons by [Lucide](https://lucide.dev/)

---

## 📊 Stats

- **100% Client-Side** - No server required
- **Privacy First** - Zero data collection
- **Fast** - < 100KB initial bundle
- **Accessible** - WCAG compliant
- **Modern** - Latest React & Next.js features

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

<a href="https://www.producthunt.com/products/gpx-elevation-editor?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-gpx&#0045;elevation&#0045;editor" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1033849&theme=light&t=1762156288094" alt="GPX&#0032;Elevation&#0032;Editor - Edit&#0032;&#0038;&#0032;analyze&#0032;gpx&#0032;elevation&#0032;profiles&#0032;online | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

Made with Next.js, TypeScript, and ❤️ to <a href="https://madeirajourney.com/hikes/" target="_blank">Madeira Hiking Trails</a> & lots of ☕

</div>
