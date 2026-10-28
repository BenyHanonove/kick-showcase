// Fronts the API Gateway endpoints with the product's own hostnames.
// Origins are Worker vars (see wrangler.example.toml), so no gateway id lives in code.
// An origin may carry a base path, e.g. a WebSocket API's stage: https://<id>.execute-api.<region>.amazonaws.com/production
const resolveOrigin = (hostname, env) => {
  if (hostname.startsWith('api.')) return env.API_ORIGIN
  if (hostname.startsWith('ws.')) return env.WS_ORIGIN
  return undefined
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = resolveOrigin(url.hostname, env)
    if (!origin) return new Response('Not found', { status: 404 })

    const base = new URL(origin)
    const target = new URL(base.pathname.replace(/\/$/, '') + url.pathname + url.search, base.origin)
    const headers = new Headers(request.headers)
    headers.delete('host')

    // WebSocket upgrades pass through: fetch returns the 101 response with the socket attached
    return fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    })
  },
}
