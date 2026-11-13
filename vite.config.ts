import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import meetingsHandler from './api/meetings';
import googleAuthHandler from './api/auth/google';

/**
 * Adapter kết nối Vite Connect Middleware với Vercel Serverless Function handlers
 * Đảm bảo 1 nguồn sự thật (Single Source of Truth) giữa môi trường local dev và Vercel production.
 */
function adaptVercelHandler(handler: any) {
  return async (req: any, res: any) => {
    try {
      const url = new URL(req.url, 'http://localhost:3000');
      req.query = Object.fromEntries(url.searchParams.entries());

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        let bodyStr = '';
        for await (const chunk of req) {
          bodyStr += chunk;
        }
        try {
          req.body = bodyStr ? JSON.parse(bodyStr) : {};
        } catch {
          req.body = bodyStr;
        }
      } else {
        req.body = req.body || {};
      }

      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };

      res.json = (data: any) => {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(data));
        return res;
      };

      res.send = (data: any) => {
        res.end(data);
        return res;
      };

      await handler(req, res);
    } catch (err: any) {
      console.error('[local-api-adapter] Handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load biến môi trường từ .env
  const env = loadEnv(mode, process.cwd(), '');
  if (env.DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api-adapter-middleware',
        configureServer(server) {
          const adaptedMeetings = adaptVercelHandler(meetingsHandler);
          const adaptedGoogleAuth = adaptVercelHandler(googleAuthHandler);

          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/')) return next();

            if (req.url.startsWith('/api/meetings')) {
              return adaptedMeetings(req, res);
            }
            if (req.url.startsWith('/api/auth/google')) {
              return adaptedGoogleAuth(req, res);
            }

            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
