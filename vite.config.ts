/**
 * Configuração do Vite: plugins do React (com React Compiler via Babel)
 * e demais opções de build da aplicação.
 */
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
