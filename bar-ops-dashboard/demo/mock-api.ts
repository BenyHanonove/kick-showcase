// In-browser mock of the KICK REST + WebSocket APIs for the demo recording.
// Every request the SPA makes to /api/** or to the WebSocket endpoint is
// answered here from fictional fixtures; nothing leaves the machine.
import type { Page, WebSocketRoute } from '@playwright/test'

import * as fx from './fixtures'

type Entity = { id: string; timestamp: string; [k: string]: unknown }

export const WS_URL = 'wss://ws.demo.invalid'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export class MockBackend {
  loggedIn = false
  readonly db: Record<string, Entity[]> = {
    client: clone(fx.clients),
    employee: clone(fx.employees),
    product: clone(fx.products),
    supplier: clone(fx.suppliers),
    session: clone(fx.sessions),
    sale: clone(fx.sales),
    shift: clone(fx.shifts),
    cashier: clone(fx.cashiers),
    consume: clone(fx.consumes),
    tips: clone(fx.tips),
    expense: clone(fx.expenses),
    mission: clone(fx.missions),
    vehicle: clone(fx.vehicles),
    document: [],
    reservation: clone(fx.reservations),
    interval: [],
  }
  private sockets: WebSocketRoute[] = []
  readonly unhandled: string[] = []

  constructor(opts: { loggedIn?: boolean } = {}) {
    this.loggedIn = !!opts.loggedIn
  }

  async install(page: Page) {
    await page.route(/\/api\//, async (route) => {
      const req = route.request()
      const url = new URL(req.url())
      const path = url.pathname.replace(/^\/api\//, '')
      const body = req.postDataJSON?.() ?? undefined
      const res = this.handle(req.method(), path, url.searchParams, body)
      await route.fulfill({
        status: res.status,
        contentType: res.contentType ?? 'application/json',
        body: typeof res.body === 'string' || Buffer.isBuffer(res.body) ? res.body : JSON.stringify(res.body),
      })
    })

    await page.routeWebSocket(/ws\.demo\.invalid/, (ws) => {
      this.sockets.push(ws)
      // joinRoom / leaveRoom messages are accepted and ignored
      ws.onMessage(() => {})
    })
  }

  // Simulate a write made by another manager: change the data "server side",
  // then broadcast the notification-only message the real broadcaster sends.
  push(action: 'CREATE' | 'UPDATE' | 'DELETE', targetStore: string, id: string) {
    const msg = JSON.stringify([{ action, targetStore, id, editor: 'another-manager-sub' }])
    for (const ws of this.sockets) ws.send(msg)
  }

  mutate(collection: string, id: string, patch: Record<string, unknown>) {
    const item = this.db[collection]!.find((e) => e.id === id)!
    Object.assign(item, patch, { timestamp: new Date().toISOString() })
    return item
  }

  insert(collection: string, entity: Entity) {
    this.db[collection]!.push(entity)
  }

  private ok(data: unknown, status = 200) {
    return { status, body: { message: 'הפעולה בוצעה בהצלחה', data } }
  }

  private handle(
    method: string,
    path: string,
    q: URLSearchParams,
    body: Record<string, unknown> | undefined,
  ): { status: number; body: unknown; contentType?: string } {
    const parts = path.split('/').filter(Boolean)
    const [resource, a, b] = parts

    if (resource === 'auth') {
      if (a === 'login') {
        this.loggedIn = true
        return this.ok(fx.authPayload)
      }
      if (a === 'refresh') {
        return this.loggedIn
          ? this.ok(fx.authPayload)
          : { status: 401, body: { message: 'Unauthorized' } }
      }
      if (a === 'logout') {
        this.loggedIn = false
        return this.ok(true)
      }
    }

    const col = resource ? this.db[resource] : undefined
    if (!col) {
      this.unhandled.push(`${method} ${path}`)
      return this.ok([])
    }

    if (method === 'GET' && a === 'summary') {
      if (resource === 'sale') return this.ok([])
      return { status: 200, body: Buffer.from(MINIMAL_PDF), contentType: 'application/pdf' }
    }

    if (method === 'GET' && !a) {
      let list = col
      for (const key of ['sessionId', 'clientId']) {
        const v = q.get(key)
        if (v) list = list.filter((e) => e[key] === v)
      }
      return this.ok(list)
    }

    if (method === 'GET' && a) {
      const item = col.find((e) => e.id === a)
      return item ? this.ok(item) : { status: 404, body: { message: 'לא נמצא' } }
    }

    if (method === 'PUT' && a) {
      const item = col.find((e) => e.id === a)
      if (!item) return { status: 404, body: { message: 'לא נמצא' } }
      if (body?.timestamp && body.timestamp !== item.timestamp) {
        return { status: 409, body: { message: 'הרשומה עודכנה על ידי משתמש אחר' } }
      }
      const { id: _id, timestamp: _ts, ...patch } = body ?? {}
      void _id
      void _ts
      return this.ok(this.mutate(resource!, a, patch))
    }

    if (method === 'POST' && !a) {
      const entity = {
        ...(body ?? {}),
        id: `${resource}-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
      } as Entity
      col.push(entity)
      return this.ok(entity, 201)
    }

    if (method === 'DELETE' && a) {
      const i = col.findIndex((e) => e.id === a)
      if (i >= 0) col.splice(i, 1)
      return this.ok(true)
    }

    void b
    this.unhandled.push(`${method} ${path}`)
    return this.ok({})
  }
}

// One blank page; enough for the SPA's blob handling if a summary is requested
const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj
trailer<</Root 1 0 R>>
%%EOF`
