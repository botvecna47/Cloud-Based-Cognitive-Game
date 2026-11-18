import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Zero external font CDNs — all fonts served locally from /fonts/*.woff2
const PRODUCTION_META_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self';";

const PRODUCTION_HEADER_CSP = `${PRODUCTION_META_CSP} frame-ancestors 'none';`;

function productionCspPlugin(): Plugin {
  return {
    name: 'production-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: PRODUCTION_META_CSP,
          },
          injectTo: 'head',
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    productionCspPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react', 'canvas-confetti'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': PRODUCTION_HEADER_CSP,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    },
  },
});
