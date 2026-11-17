import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: https://shin-phys.github.io/answer_sanity_check/
export default defineConfig({
  base: '/answer_sanity_check/',
  plugins: [react(), tailwindcss()],
  // KaTeX（数式表示）を同梱するため、1ファイルが 500 kB を少し超える
  build: { chunkSizeWarningLimit: 700 },
})
