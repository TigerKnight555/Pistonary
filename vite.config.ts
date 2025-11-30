import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Ignoriere TypeScript-Fehler beim Build für Docker
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignoriere spezifische Warnungen
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  }
})
