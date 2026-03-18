import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const favoritesApiPlugin = () => ({
  name: 'favorites-api',
  configureServer(server) {
    const filePath = path.resolve(__dirname, 'src/data/favorites.json');

    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }

    server.middlewares.use('/api/favorites', (req, res) => {
      // Handle CORS
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'GET') {
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          res.end(data);
        } catch {
          res.end('[]');
        }
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  base: '/musicApp/',
  plugins: [react(), favoritesApiPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
})
