import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import path from "path"
import fs from "fs"

function loadAllEnv(mode) {
  return {
    name: 'load-env',
    buildStart() {
      const modeEnvPath = path.join(__dirname, `env.${mode}.json`)
      if (fs.existsSync(modeEnvPath)) {
        process.env['MYENV'] = fs.readFileSync(modeEnvPath, 'utf8')
        // process.env['MYENV'] = JSON.parse(envContent)
        console.log(`✅ .env.${mode}.json 已加载`)
      }
    }
  }
}

export default defineConfig(({ command, mode }) => ({
  main: {
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        '@main': resolve('src/main')
      }
    },
    plugins: [loadAllEnv(mode)],
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
}))
