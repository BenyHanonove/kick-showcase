# Layer 1 — App shell & config

**Files:** [`src/main.ts`](../../bar-ops-dashboard/src/main.ts) ·
[`src/App.vue`](../../bar-ops-dashboard/src/App.vue) ·
[`src/config/`](../../bar-ops-dashboard/src/config/) ·
[`vite.config.ts`](../../bar-ops-dashboard/vite.config.ts)

## Boot order

```
main.ts
 ├─ createApp(App)
 ├─ app.use(pinia)  ·  app.use(vuetify)
 ├─ register global components + global properties
 └─ rehydrateSession()            ← silent login from the httpOnly refresh cookie
      └─ .finally(() => { app.use(router); app.mount('#app') })
```

The router is installed **after** session rehydration, on purpose: the navigation guard
must already know whether a user exists, otherwise a refresh on a protected page
bounces to `/login`.

## Globals registered in `main.ts`

- **Components** (usable without importing): `AppButton`, `AppList`, `AppListItem`,
  `AppCard`, `AppDialog`, `AppInput`, `AppTable`, `EmptyState`, `GenericForm`,
  `PageHeader`, `GlobalLoading`, `StatusChip`, `MetricCard`, `AppLayout`, `AppSnackbar`.
- **Properties**: `$rules`, `$formatPhoneNumber`, `$formatNumber`, `$formatCurrency`,
  `$compactCurrency`, `$formatDate`, `$whatsAppUrl`, `$addVat`, `$removeVat`,
  `$VAT_RATE`, `$VAT_PERCENT`.

In `<script setup>` prefer the explicit import (`import { formatCurrency } from
'@shared/utils/formatters.util'`); the globals exist for templates.

## Stale-build recovery

After a deploy the hashed chunk filenames change. A browser holding a cached
`index.html` (Safari does) asks for chunks that 404 → blank page. Two guards handle it:

- `window.addEventListener('vite:preloadError')` in `main.ts`
- `router.onError` matching "dynamically imported module" / "Failed to fetch"

Both call a single `location.reload()`, guarded by the `stale-build-reloaded`
sessionStorage key so it can never loop. `vite.config.ts` reinforces this by emitting
assets under a per-build folder (`assets/<BUILD_ID>/`) so a URL always names the same
bytes.

## Config

| File | Owns |
| --- | --- |
| `config/env/env.ts` | the **only** place `import.meta.env` is read — `api.baseUrl` (`VITE_AWS_URL`), `api.timeoutMs`, `app.*`, `cognito.*`, `websocket.url` |
| `config/theme/` | Vuetify instance, light/dark palettes, tokens, typography |
| `config/store/index.ts` | Pinia instance (+ persisted-state plugin) and the central store re-exports |
| `config/router/index.ts` | route aggregation, guards, head meta |

`@plugins` → `config/index.ts` re-exports theme + env, which is why you see
`import { env } from '@plugins'`.

## Environments

`npm run dev` reads `.env` (and `.env.development` if present, which wins). The
production build gets its variables from the Cloudflare Pages project.

> The production API Gateway's CORS allowlist contains `https://kicks.ltd` only, so a
> local dev server must point `VITE_AWS_URL` at the **dev** stage gateway. Pointing it
> at `api.kicks.ltd` fails preflight with "No 'Access-Control-Allow-Origin' header".

## Theme

`App.vue` subscribes to `prefers-color-scheme` and calls `theme.change(...)`, so the
dashboard follows the OS. Colors come from `config/theme/*-colors.ts` and the CSS
custom properties in `assets/styles/tokens.css` — never hardcode a hex in a component.

## Deployment & the edge

The built SPA is served by **Cloudflare Pages** at `kicks.ltd`, with two edge pieces
that are part of the architecture, not build noise:

| File | Job |
| --- | --- |
| [`functions/_middleware.js`](../../bar-ops-dashboard/functions/_middleware.js) | Pages Function that rewrites `<title>` / `description` / `og:` / `twitter:` tags per public route **before** the static `index.html` is returned — link-preview crawlers do not run JS, so this is the only way WhatsApp shows route-specific text for `/reserve`, `/employees/self-register`, etc. |
| [`public/_headers`](../../bar-ops-dashboard/public/_headers) | Cache rules. `/assets/*` is immutable (`max-age=31536000`) because those URLs are content-hashed *and* build-scoped; documents keep the platform default `max-age=0, must-revalidate` so a deploy is picked up immediately. |

`_headers` matches the **request** path, not the served file — a rule for `/index.html`
never fires, because visitors request `/` or `/sessions/…` and the SPA fallback resolves
the file.

Adding a new public route that gets shared as a link means adding it to `ROUTE_META` in
the middleware; everything else is automatic.
