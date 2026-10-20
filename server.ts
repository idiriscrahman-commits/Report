/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './src/server/app.ts';
import { dataStore } from './src/server/storage/dataStore.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0';

  // Initialize unified dataStore (MongoDB Atlas or persistent local store)
  await dataStore.init(process.env.MONGODB_URI);

  const app = createExpressApp();

  if (!isProduction) {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use((await import('express')).default.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, host, () => {
    console.log(`[SRMS Server] Running at http://${host}:${port}`);
    console.log(`[SRMS Server] Mode: ${isProduction ? 'production' : 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('[SRMS Server] Fatal startup error:', err);
  process.exit(1);
});
