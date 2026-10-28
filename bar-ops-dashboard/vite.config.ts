import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// Assets go under a per-build folder so no deploy ever reuses an asset URL.
// Content hashing alone cannot promise that: an unchanged source file keeps its
// hash, so a URL a browser cached badly stays poisoned across every later build.
const BUILD_ID = Date.now().toString(36)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), vuetify({ autoImport: true })],
    define: {
      global: 'window',
    },

    // Stays nested under /assets/ so the _headers rule and the middleware guard
    // both keep matching on that prefix.
    build: {
      assetsDir: `assets/${BUILD_ID}`,
    },

    server: {
      proxy: {
        // Same-origin in dev so the SameSite=Lax refresh cookie is sent on reload
        '/api': {
          target: env.VITE_AWS_URL,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
          // No domain rewrite: kicks.ltd-scoped clear cookies must stay rejected, not wipe the live one
          cookiePathRewrite: { '/auth': '/api/auth' },
        },
      },
    },

    resolve: {
      alias: {
        '@router': fileURLToPath(new URL('./src/config/router/index.ts', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/config/store/index.ts', import.meta.url)),
        '@plugins': fileURLToPath(new URL('./src/config/index.ts', import.meta.url)),
        '@layout': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),

        '@auth': fileURLToPath(new URL('./src/modules/auth', import.meta.url)),
        '@cashier': fileURLToPath(new URL('./src/modules/cashier', import.meta.url)),
        '@client': fileURLToPath(new URL('./src/modules/client', import.meta.url)),
        '@consume': fileURLToPath(new URL('./src/modules/consume', import.meta.url)),
        '@document': fileURLToPath(new URL('./src/modules/document', import.meta.url)),
        '@employee': fileURLToPath(new URL('./src/modules/employee', import.meta.url)),
        '@expense': fileURLToPath(new URL('./src/modules/expense', import.meta.url)),
        '@interval': fileURLToPath(new URL('./src/modules/interval', import.meta.url)),
        '@landing': fileURLToPath(new URL('./src/modules/landing', import.meta.url)),
        '@legal': fileURLToPath(new URL('./src/modules/legal', import.meta.url)),
        '@links': fileURLToPath(new URL('./src/modules/links', import.meta.url)),
        '@missions': fileURLToPath(new URL('./src/modules/missions', import.meta.url)),
        '@product': fileURLToPath(new URL('./src/modules/product', import.meta.url)),
        '@reservation': fileURLToPath(new URL('./src/modules/reservation', import.meta.url)),
        '@sale': fileURLToPath(new URL('./src/modules/sale', import.meta.url)),
        '@session': fileURLToPath(new URL('./src/modules/session', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/modules/shared', import.meta.url)),
        '@shift': fileURLToPath(new URL('./src/modules/shift', import.meta.url)),
        '@supplier': fileURLToPath(new URL('./src/modules/supplier', import.meta.url)),
        '@tips': fileURLToPath(new URL('./src/modules/tips', import.meta.url)),
        '@vehicle': fileURLToPath(new URL('./src/modules/vehicle', import.meta.url)),
      },
    },
  }
})
