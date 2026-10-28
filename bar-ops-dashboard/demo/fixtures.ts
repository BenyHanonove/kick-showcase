// Fictional demo data for the recording harness. Every name, phone number and
// business below is invented; none of it comes from production.

const now = new Date()
const Y = now.getFullYear()
const M = now.getMonth() // 0-based
const pad = (n: number) => String(n).padStart(2, '0')
export const MONTH_YEAR = `${Y}-${pad(M + 1)}`

const day = (d: number, h = 20) => new Date(Date.UTC(Y, M, d, h - 3, 0, 0)).toISOString()
const ts = (minutesAgo = 60) => new Date(Date.now() - minutesAgo * 60_000).toISOString()

export const DEMO_USER = {
  email: 'demo@kick.example',
  firstName: 'דנה',
  lastName: 'מנהלת',
  groups: ['Admin'],
}

// Unsigned JWT-shaped token: the SPA only base64-decodes the payload for `sub`
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
export const FAKE_ID_TOKEN = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
  sub: 'demo-admin-sub',
  email: DEMO_USER.email,
  'cognito:groups': DEMO_USER.groups,
  exp: Math.floor(Date.now() / 1000) + 3600 * 8,
})}.sig`

export const authPayload = {
  user: DEMO_USER,
  authTokens: { AccessToken: 'demo-access', IdToken: FAKE_ID_TOKEN, ExpiresIn: 3600 * 8, ExpiresAt: 0 },
}

// --- Clients --------------------------------------------------------------
export const clients = [
  { id: 'c-1', name: 'הפקות גל כחול', brand: 'Blue Wave', phone: '0500000001', email: 'events@bluewave.example', timestamp: ts(9000) },
  { id: 'c-2', name: 'אחוזת התאנים', brand: 'Fig Estate', phone: '0500000002', timestamp: ts(9000) },
  { id: 'c-3', name: 'מועדון המגדלור', brand: 'Lighthouse', phone: '0500000003', timestamp: ts(9000) },
  { id: 'c-4', name: 'חוף הזהב הפקות', brand: 'Golden Shore', phone: '0500000004', timestamp: ts(9000) },
]

// --- Employees ------------------------------------------------------------
const people: [string, string, string, string][] = [
  ['אורי', 'בן-שחר', 'bartender', 'expert'],
  ['מאיה', 'גלעדי', 'bartender', 'senior'],
  ['יונתן', 'רוזן', 'bartender', 'experienced'],
  ['שירה', 'אלמוג', 'waiter', 'experienced'],
  ['עידו', 'כרמלי', 'hybrid', 'senior'],
  ['נועם', 'תבור', 'bartender', 'junior'],
  ['ליה', 'פרחי', 'waiter', 'junior'],
  ['תומר', 'אשכנזי', 'manager', 'expert'],
  ['רוני', 'שקד', 'waiter', 'experienced'],
  ['אביב', 'נחמיאס', 'bartender', 'trainee'],
  ['גל', 'ארבל', 'hybrid', 'experienced'],
  ['הדר', 'יערי', 'waiter', 'senior'],
  ['עמית', 'לבנון', 'manager', 'senior'],
]
export const employees = people.map(([firstName, lastName, type, level], i) => ({
  id: `e-${i + 1}`,
  firstName,
  lastName,
  identityNumber: `00000000${i}`.slice(-9),
  phone: `05000001${pad(i)}`,
  type,
  level,
  gender: i % 2 ? 'female' : 'male',
  status: 'APPROVED',
  timestamp: ts(8000),
}))

// --- Suppliers / products ------------------------------------------------
export const suppliers = [
  { id: 'sp-1', name: 'משקאות הצפון', phone: '0400000001', contactName: 'רפי', address: 'אזור תעשייה, חיפה', timestamp: ts(9000) },
  { id: 'sp-2', name: 'קרח ושות׳', phone: '0400000002', contactName: 'מירב', address: 'רחוב המלאכה 3, חולון', timestamp: ts(9000) },
]
const prod = (id: string, name: string, type: string, price: number, volume: number, supplierId = 'sp-1', isBase = false) => ({
  id, name, type, price, volume, supplierId, isBase, quantity: 0, timestamp: ts(9000),
})
export const products = [
  prod('p-1', 'וודקה 1 ליטר', 'alcohol', 89, 1000, 'sp-1', true),
  prod('p-2', 'ג׳ין 0.7 ליטר', 'alcohol', 119, 700, 'sp-1', true),
  prod('p-3', 'רום לבן 1 ליטר', 'alcohol', 79, 1000, 'sp-1', true),
  prod('p-4', 'טקילה 0.7 ליטר', 'alcohol', 139, 700),
  prod('p-5', 'אראק 1 ליטר', 'alcohol', 69, 1000),
  prod('p-6', 'טוניק (ארגז)', 'soda', 48, 24),
  prod('p-7', 'סודה (ארגז)', 'soda', 36, 24),
  prod('p-8', 'משקה אנרגיה (ארגז)', 'energy_drink', 140, 24),
  prod('p-9', 'קרח 10 ק״ג', 'accompanying', 18, 10, 'sp-2'),
  prod('p-10', 'כוסות חד-פעמיות (1000)', 'disposable', 95, 1000, 'sp-2'),
  prod('p-11', 'לימונים (ארגז)', 'accompanying', 55, 1, 'sp-2'),
]

// --- Sessions (events) ----------------------------------------------------
const session = (
  id: string, d: number, name: string, clientId: string, type: string, status: string,
  peopleAmount: number, location: string, extra: object = {},
) => ({
  id, clientId, datetime: day(d, 20), name, type, status, peopleAmount, location,
  processingFee: 1.5, timestamp: ts(300), barmanAmount: 6, waitersAmount: 4,
  barMangerAmount: 1, waiterMangerAmount: 1, Runners: 2, split: 0, notes: '', ...extra,
})
export const sessions = [
  session('s-1', 3, 'השקת קולקציית סתיו', 'c-1', 'house', 'close', 350, 'נמל תל אביב'),
  session('s-2', 7, 'חתונה בכרם', 'c-2', 'concert', 'close', 420, 'אחוזת התאנים, זכרון'),
  session('s-3', 12, 'ליל טכנו בגג', 'c-3', 'techno', 'flag', 600, 'גג המגדלור, יפו'),
  session('s-4', 18, 'מסיבת זריחה', 'c-4', 'nature_party', 'close', 900, 'חוף הזהב, ניצנים'),
  session('s-5', Math.min(now.getDate(), 28), 'פסטיבל חוף הזהב', 'c-4', 'hardstyle', 'active', 1200, 'חוף הזהב, ניצנים'),
  session('s-6', Math.min(now.getDate() + 1, 28), 'אירוע חברה רבעוני', 'c-1', 'concert', 'active', 250, 'מתחם הנמל, חיפה'),
]
export const MAIN_SESSION = 's-5'

// --- Main event: shifts, cashiers, tips, consumption ---------------------
const roles = ['barmanger', 'bartender', 'bartender', 'bartender', 'waitermanger', 'bartender', 'waiter', 'waiter', 'runner', 'bartender', 'waiter', 'runner']
const timings = ['17:00', '18:00', '18:00', '18:30', '17:30', '18:30', '19:00', '19:00', '18:00', '19:30', '19:00', '18:00']
const MAIN_DAY = Math.min(now.getDate(), 28)
const timingIso = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(Y, M, MAIN_DAY, h! - 3, m!)).toISOString()
}
export const shifts = employees.slice(0, 12).map((e, i) => ({
  id: `sh-${i + 1}`,
  sessionId: MAIN_SESSION,
  employeeId: e.id,
  role: roles[i],
  timing: timingIso(timings[i]!),
  totalHours: [9, 8, 8, 7.5, 8.5, 7.5, 7, 7, 8, 6.5, 7, 8][i],
  hourly: [70, 55, 50, 50, 60, 48, 42, 42, 40, 45, 42, 40][i],
  bonusTravel: i % 3 === 0 ? 30 : 0,
  bonusManage: roles[i]!.includes('manger') ? 100 : 0,
  bonusOther: 0,
  bonusSetup: i < 3 ? 50 : 0,
  approved: i < 10,
  registration: 'APPROVED',
  received: false,
  notes: '',
  timestamp: ts(120),
}))

export const cashiers = [
  { id: 'ca-1', sessionId: MAIN_SESSION, cash: 8420, credit: 31650, creditTip: 2380, location: 'bar', serial: '1001', timestamp: ts(40) },
  { id: 'ca-2', sessionId: MAIN_SESSION, cash: 5210, credit: 24890, creditTip: 1940, location: 'bar', serial: '1002', timestamp: ts(40) },
  { id: 'ca-3', sessionId: MAIN_SESSION, cash: 2650, credit: 11300, creditTip: 1120, location: 'tables', serial: '2001', timestamp: ts(40) },
]

export const tips = [
  { id: 't-bar', sessionId: MAIN_SESSION, area: 'bar', cashTip: 3120, creditTip: 4320, totalHours: 54, runnerFeed: 10, timestamp: ts(30) },
  { id: 't-tables', sessionId: MAIN_SESSION, area: 'tables', cashTip: 1460, creditTip: 1120, totalHours: 29, runnerFeed: 10, timestamp: ts(30) },
]

const consume = (id: string, productId: string, target: number, order: number, arrived: number, returnedToStorage: number) => {
  const p = products.find((x) => x.id === productId)!
  return {
    id, sessionId: MAIN_SESSION, productId, chargedPrice: Math.round(p.price * 1.35), supplierPrice: p.price,
    target, order, arrived, fromStorage: 0, creditedToSupplier: 0, returnedToStorage, timestamp: ts(50),
  }
}
export const consumes = [
  consume('co-1', 'p-1', 40, 40, 40, 6),
  consume('co-2', 'p-2', 24, 24, 24, 3),
  consume('co-3', 'p-3', 18, 18, 18, 4),
  consume('co-4', 'p-4', 12, 12, 12, 2),
  consume('co-5', 'p-5', 10, 10, 10, 1),
  consume('co-6', 'p-6', 30, 30, 30, 5),
  consume('co-7', 'p-7', 30, 30, 28, 6),
  consume('co-8', 'p-8', 20, 20, 20, 4),
  consume('co-9', 'p-9', 60, 60, 60, 0),
  consume('co-10', 'p-10', 4, 4, 4, 1),
  consume('co-11', 'p-11', 6, 6, 6, 0),
]

export const expenses = [
  { id: 'ex-1', sessionId: MAIN_SESSION, name: 'הובלת ציוד', amount: 850, paidBy: 'house', invoice: true, vat: true, timestamp: ts(200) },
  { id: 'ex-2', sessionId: MAIN_SESSION, name: 'קרח נוסף', amount: 240, paidBy: 'tips', invoice: false, vat: false, timestamp: ts(90) },
]

export const missions = [
  { id: 'm-1', sessionId: MAIN_SESSION, name: 'הקמת בר מרכזי', desc: 'שני עמדות + מקרר', status: 'completed', monthYear: MONTH_YEAR, timestamp: ts(300) },
  { id: 'm-2', sessionId: MAIN_SESSION, name: 'ספירת מלאי פתיחה', desc: '', status: 'completed', monthYear: MONTH_YEAR, timestamp: ts(100) },
  { id: 'm-3', sessionId: MAIN_SESSION, name: 'תדריך צוות', desc: '19:15 ליד הבר', status: 'completed', monthYear: MONTH_YEAR, timestamp: ts(100) },
]

export const vehicles = [
  { id: 'v-1', sessionId: MAIN_SESSION, desc: 'הסעה מתל אביב', driverShiftId: 'sh-5', sum: 180, licensePlate: '00-000-00', passengerShiftIds: ['sh-2', 'sh-3', 'sh-6'], timestamp: ts(200) },
]

export const reservations = [
  { id: 'r-1', fullName: 'אלון ברק', phone: '0500000201', eventType: 'wedding', eventDate: day(26), guestCount: 300, location: 'גליל מערבי', status: 'new', timestamp: ts(600) },
  { id: 'r-2', fullName: 'סתיו מרום', phone: '0500000202', eventType: 'company', eventDate: day(27), guestCount: 120, location: 'הרצליה', status: 'contacted', timestamp: ts(900) },
]

export const sales = [
  { id: 'sa-1', clientId: 'c-3', datetime: day(9), name: 'מכירת מלאי למגדלור', paid: true, timestamp: ts(5000) },
]

// Shift that "another manager" adds during the recording (arrives via WebSocket)
export const liveShift = {
  id: 'sh-live',
  sessionId: MAIN_SESSION,
  employeeId: 'e-13',
  role: 'barmanger',
  timing: timingIso('17:30'),
  totalHours: 8.5,
  hourly: 65,
  bonusTravel: 0,
  bonusManage: 100,
  bonusOther: 0,
  bonusSetup: 0,
  approved: true,
  registration: 'APPROVED',
  received: false,
  notes: '',
  timestamp: new Date().toISOString(),
}
