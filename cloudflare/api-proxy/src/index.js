// Maps each public hostname to its API Gateway endpoint.
const ROUTES = {
  'api.kicks.ltd': { origin: 'https://dn3xyet6gl.execute-api.eu-west-1.amazonaws.com', prefix: '' },
  'ws.kicks.ltd': { origin: 'https://q5tfo2tmuk.execute-api.eu-west-1.amazonaws.com', prefix: '/production' },
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const route = ROUTES[url.hostname]
    if (!route) return new Response('Not found', { status: 404 })

    const target = new URL(route.prefix + url.pathname + url.search, route.origin)
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
