import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    define: {
        global: {},
    },
    server: {
        port: 3000,        
        proxy: {
            '/socket.io': {
              target: 'https://warro-dance-party.herokuapp.com',
              ws: true,
              changeOrigin: true,
              secure: true,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              }
            },
            '^/(agenda|avatars|test|agenda-admin)': {
              target: 'http://localhost:3030',
              changeOrigin: true,
              secure: false
            }
        },
        fs: {
            allow: [
                '..', // allow one level up                
            ]
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
    },
    esbuild: {
        loader: 'jsx'
    },
    optimizeDeps: {
        include: ['socket.io-client'],
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true
            }
        }
    }
}); 