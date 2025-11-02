#!/usr/bin/env node

/**
 * Preview server for testing production build locally
 * Simple HTTP server that serves the production build
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const OUT_DIR = path.join(__dirname, 'out');
const BASE_PATH = '/Projects/elevation';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.gpx': 'application/gpx+xml',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Remove base path from URL
  let filePath = req.url;
  if (filePath.startsWith(BASE_PATH)) {
    filePath = filePath.substring(BASE_PATH.length);
  }

  // Default to index.html
  if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  }

  // Construct full file path
  const fullPath = path.join(OUT_DIR, filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
    return;
  }

  // Read and serve file
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>500 Internal Server Error</h1>');
      return;
    }

    const ext = path.extname(fullPath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 Preview server running!');
  console.log(`\n   Local:   http://localhost:${PORT}${BASE_PATH}/`);
  console.log(`\n   Press Ctrl+C to stop\n`);
});

process.on('SIGINT', () => {
  console.log('\n\n🧹 Shutting down server...');
  server.close();
  process.exit(0);
});
