import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const geojsonPlugin: Plugin = {
  name: 'vite-plugin-geojson',
  transform(src: string, id: string) {
    if (id.endsWith('.geojson')) {
      return {
        code: `export default ${JSON.stringify(JSON.parse(src))};`,
        map: null,
      };
    }
  },
};

export default defineConfig(() => {
  return {
    plugins: [geojsonPlugin, react(), tailwindcss()],
    base: '/social-travel-log/', // 이 줄을 추가하세요.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
