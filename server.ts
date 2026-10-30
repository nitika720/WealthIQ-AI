import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_PATH = path.resolve(__dirname, 'dist');

// In production, serve static files from Vite build output
app.use(express.static(DIST_PATH));

// Fallback to index.html for SPA client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WealthIQ AI Engine] Full-stack production server listening on http://0.0.0.0:${PORT}`);
});
