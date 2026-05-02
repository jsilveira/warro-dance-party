import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.VITE_API_URL || 'http://localhost:3030';
    const isHttps = apiTarget.startsWith('https://');

    return {
        plugins: [react()],
        define: {
            global: {},
        },
        server: {
            port: 3000,
            proxy: {
                '/socket.io': {
                    target: apiTarget,
                    ws: true,
                    changeOrigin: true,
                    secure: isHttps,
                },
                '^/(agenda|avatars|test|agenda-admin)': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: isHttps,
                },
            },
            fs: {
                allow: ['..'],
            },
        },
        build: {
            outDir: '../server/public/ui',
            emptyOutDir: true,
            assetsDir: 'assets',
            sourcemap: true,
        },
        esbuild: {
            loader: 'jsx',
        },
        optimizeDeps: {
            include: ['socket.io-client'],
        },
        css: {
            preprocessorOptions: {
                less: {
                    javascriptEnabled: true,
                },
            },
        },
    };
});
