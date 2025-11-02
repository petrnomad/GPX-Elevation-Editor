# Elevation Editor

A web application for editing and analyzing GPX files with advanced features for elevation profile editing.

## Description

Elevation Editor is a modern web application built with Next.js that enables:

- **GPX File Loading** - Import your own GPS tracks in GPX format
- **Elevation Profile Visualization** - Interactive elevation chart
- **Anomaly Detection** - Automatic detection of unusual elevation spikes
- **Elevation Profile Editing** - Manual elevation data adjustments
- **Route Map** - Display GPS track on an interactive map
- **Export** - Download modified GPX files

## Technologies

- **Framework:** Next.js 15 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **Charts:** Recharts
- **Maps:** Leaflet, React Leaflet
- **XML Parser:** fast-xml-parser

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd "GPX adjuster"

# Install dependencies
npm install
```

## Running the Application

### Development server

```bash
npm run dev
```

The application will run at [http://localhost:3000](http://localhost:3000)

### Production build

```bash
npm run build
npm run start
```

### Static export

```bash
npm run export
```

Generates static files in the `/out` folder, which can be deployed to any hosting platform (Netlify, Vercel, GitHub Pages, etc.)

## Project Structure

```
GPX adjuster/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── elevation-editor.tsx   # Elevation profile editor
│   ├── elevation-map.tsx      # Map with route
│   ├── gpx-upload.tsx         # GPX file upload
│   └── ui/                    # UI components (shadcn/ui)
├── lib/                   # Utility functions
│   └── gpx-parser.ts     # GPX file parser
├── public/               # Static files
│   └── sample.gpx       # Sample GPX file
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Project dependencies
```

## Application Features

### Elevation Profile Editing

- **Interactive Chart** - Click on the chart to adjust elevation at any point
- **Smoothing** - Smooth the elevation profile using a moving average
- **Reset** - Restore original values

### Anomaly Detection

- **Automatic Detection** - Finds unusual elevation spikes
- **Configurable Threshold** - Adjustable detection sensitivity
- **Ignore Anomalies** - Option to disable detection and edit freely

### Export

- Modified GPX files can be downloaded with original or new filename
- Preserves all original metadata (timestamps, GPS coordinates)
- Updates only elevation data

## Deployment

The application is ready for deployment as:

1. **Static Website** - `npm run build` generates optimized static files
2. **Server-side rendering** - Can be deployed on Node.js server
3. **Platforms** - Vercel, Netlify, GitHub Pages, Cloudflare Pages

### Example: Deploying to Vercel

```bash
# Using Vercel CLI
npm install -g vercel
vercel
```

### Example: Deploying as Static Website

```bash
npm run build
# The /out folder contains static files ready for deployment
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run export` - Alias for build (creates static export)

### Adding New Features

The application uses a modular architecture. New features can be added by:

1. Creating new components in `/components`
2. Extending the GPX parser in `/lib/gpx-parser.ts`
3. Adding new UI components from shadcn/ui

## License

This project is private.

## Author

© 2025
