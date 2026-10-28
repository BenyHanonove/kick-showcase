// Cloudflare Pages Function: per-route link-preview metadata.
//
// The dashboard is a client-side Vue SPA, so every path is served the same
// static index.html. Link-preview crawlers (WhatsApp, Facebook, X, ...) do NOT
// execute JavaScript, so they only ever see index.html's global KICK tags.
//
// This middleware runs at the edge before the static asset is returned. For the
// public self-register / self-update paths it rewrites the title, description,
// and og:/twitter: title+description so a shared link shows route-specific text.
// The logo (og:image / favicon) is intentionally left untouched — same image
// for every route.

const ROUTE_META = {
  '/links': {
    title: 'KICK 🍸 — הבית שלנו',
    description: 'רוצים לעבוד איתנו או לסגור אירוע? כל הקישורים של KICK במקום אחד.',
  },
  '/reserve': {
    title: 'הזמנת בר לאירוע – KICK',
    description:
      'בר מלא לאירוע: אלכוהול, ציוד וצוות ברמנים. משאירים פרטים, מרימים אליכם טלפון וחוזרים עם הצעת מחיר מותאמת.',
  },
  '/employees/self-register': {
    title: 'רישום עובדים – KICK',
    description: 'הצטרפו לצוות הברמנים של KICK. מלאו את הפרטים ונחזור אליכם.',
  },
  '/employees/self-update': {
    title: 'עדכון פרטים אישיים – KICK',
    description: 'עדכנו את הפרטים האישיים שלכם עבור צוות KICK.',
  },
  '/privacy-policy': {
    title: 'מדיניות פרטיות – KICK',
    description: 'מדיניות הפרטיות של KICK שירותי בר בע"מ — איזה מידע נאסף, כיצד הוא נשמר ומה הזכויות שלכם.',
  },
  '/accessibility': {
    title: 'הצהרת נגישות – KICK',
    description: 'הצהרת הנגישות של KICK שירותי בר בע"מ — רמת הנגישות, ההתאמות שבוצעו ודרכי פנייה לרכז הנגישות.',
  },
}

// Route aliases share the same metadata as their canonical path.
ROUTE_META['/reservation'] = ROUTE_META['/reserve']
ROUTE_META['/self-register'] = ROUTE_META['/employees/self-register']
ROUTE_META['/self-update'] = ROUTE_META['/employees/self-update']

class SetText {
  constructor(value) {
    this.value = value
  }
  element(element) {
    element.setInnerContent(this.value)
  }
}

class SetAttr {
  constructor(attr, value) {
    this.attr = attr
    this.value = value
  }
  element(element) {
    element.setAttribute(this.attr, this.value)
  }
}

export async function onRequest(context) {
  const { request, next } = context
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/'
  const meta = ROUTE_META[pathname]

  const response = await next()
  const isHtml = (response.headers.get('content-type') || '').includes('text/html')

  // A path ending in an extension names a file, never a client route, so HTML
  // coming back for one means the SPA fallback in _redirects (/* ->
  // /index.html 200) answered a miss. That happens for a few seconds after a
  // deploy, while the edge still serves the previous deployment's files.
  //
  // Passing it through lets the /assets/* immutable rule in _headers pin that
  // HTML under a .js URL for a year: the browser rejects it on MIME type, stops
  // revalidating, and the app never boots again. An uncacheable 404 keeps the
  // miss from being stored anywhere and lets the client retry.
  const namesAFile = !/\.html?$/i.test(pathname) && /\.[a-z0-9]+$/i.test(pathname)

  if (isHtml && namesAFile) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  }

  // Nothing to override, or the asset isn't HTML (JS/CSS/images) — pass through.
  if (!meta || !isHtml) return response

  return new HTMLRewriter()
    .on('title', new SetText(meta.title))
    .on('meta[name="description"]', new SetAttr('content', meta.description))
    .on('meta[property="og:title"]', new SetAttr('content', meta.title))
    .on('meta[property="og:description"]', new SetAttr('content', meta.description))
    .on('meta[name="twitter:title"]', new SetAttr('content', meta.title))
    .on('meta[name="twitter:description"]', new SetAttr('content', meta.description))
    .transform(response)
}
