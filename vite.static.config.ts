import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: 'static', base: '/lyric-grid-docs/', publicDir: '../public',
  plugins: [{ name: 'static-site-links', enforce: 'pre', transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/app/doc-view.tsx')) return code.replaceAll('https://lyric-grid-cn.beiai.chatgpt.site/', 'https://beiai-sama.github.io/lyric-grid/');
  } }, react()], css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  define: { 'import.meta.env.VITE_STATIC_SITE': 'true' },
  build: { outDir: '../out', emptyOutDir: true },
});
