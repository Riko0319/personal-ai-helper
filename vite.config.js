import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    base: './',
    server: {
        port: 5173,
        strictPort: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: {
                    'element-plus': ['element-plus'],
                    'vue-vendor': ['vue', 'vue-router', 'pinia']
                }
            }
        }
    }
});
