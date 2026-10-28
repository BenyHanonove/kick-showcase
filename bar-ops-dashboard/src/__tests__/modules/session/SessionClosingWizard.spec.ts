import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import SessionClosingWizard from '../../../modules/session/components/SessionClosingWizard.vue'
import {
  VAlert,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VBtn,
  VAvatar,
  VIcon,
  VChip,
  VList,
  VListItem,
  VCheckbox,
  VRow,
  VCol,
  VDivider,
} from 'vuetify/components'

// Mock localStorage for jsdom/vitest environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})
global.localStorage = localStorageMock as unknown as Storage


const mockCashiers = [
  { id: 'c1', cash: 100, credit: 50, creditTip: 10 },
  { id: 'c2', cash: 200, credit: 150, creditTip: 20 },
]

const mockExpenses = [
  { id: 'exp1', amount: 100, paidBy: 'house' },
  { id: 'exp2', amount: 50, paidBy: 'client' },
]

const mockTips = [
  { id: 't1', area: 'bar', cashTip: 20, creditTip: 10, runnerFeed: 5 },
  { id: 't2', area: 'tables', cashTip: 15, creditTip: 25, runnerFeed: 0 },
]

// Mutable so individual tests can simulate different shift/hourly/timing states
let mockShifts: {
  id: string
  employeeId: string
  approved: boolean
  hourly: number | null
  timing?: string | null
}[] = [
  { id: '1', employeeId: 'emp1', approved: true, hourly: 50, timing: '2026-07-20T18:00:00.000Z' },
  { id: '2', employeeId: 'emp2', approved: true, hourly: 60, timing: '2026-07-20T18:00:00.000Z' },
]

// Mutable so individual tests can simulate different mission states
let mockMissions: { id: string; name: string; desc: string; status: string }[] = [
  { id: 'm1', name: 'הצבת ציוד', desc: 'להציב את כל הציוד לפני האירוע', status: 'completed' },
]

// Mock the stores
vi.mock('@stores', () => {
  return {
    SessionStore: () => ({
      shifts: {
        get data() {
          return mockShifts
        },
      },
      get registeredShifts() {
        return mockShifts
      },
      expenses: {
        data: mockExpenses,
      },
      cashiers: {
        data: mockCashiers,
      },
      consumes: {
        data: [],
      },
      tips: {
        data: mockTips,
      },
      missions: {
        get data() {
          return mockMissions
        },
      },
    }),
    EmployeesStore: () => ({
      get: (id: string) => {
        if (id === 'emp1') return { firstName: 'John', lastName: 'Doe' }
        if (id === 'emp2') return { firstName: 'Jane', lastName: 'Smith' }
        return null
      },
    }),
    ProductsStore: () => ({
      get: () => null,
    }),
  }
})

const globalComponents = {
  VAlert,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VBtn,
  VAvatar,
  VIcon,
  VChip,
  VList,
  VListItem,
  VCheckbox,
  VRow,
  VCol,
  VDivider,
}

const mountWizard = () =>
  mount(SessionClosingWizard, {
    props: {
      sessionId: 'session1',
    },
    global: {
      components: globalComponents,
    },
  })

const clickButtonWithText = async (wrapper: ReturnType<typeof mountWizard>, text: string) => {
  const button = wrapper.findAll('button').find((b) => b.text().includes(text))
  await button?.trigger('click')
  await nextTick()
}

const goToHourlyTipsStep = async (wrapper: ReturnType<typeof mountWizard>) => {
  await clickButtonWithText(wrapper, 'המשך') // step 1 -> 2 (cashier)
  await wrapper.find('input[type="checkbox"]').setValue(true)
  await clickButtonWithText(wrapper, 'המשך') // step 2 -> 3 (shifts)
  await clickButtonWithText(wrapper, 'המשך') // step 3 -> 4 (expenses)
  await wrapper.find('input[type="checkbox"]').setValue(true)
  await clickButtonWithText(wrapper, 'המשך') // step 4 -> 5 (hourly & tips)
}

const goToMissionsStep = async (wrapper: ReturnType<typeof mountWizard>) => {
  await goToHourlyTipsStep(wrapper)
  await clickButtonWithText(wrapper, 'המשך') // step 5 -> 6 (missions)
}

describe('SessionClosingWizard Component', () => {
  beforeEach(() => {
    // Clear persisted step so each test starts fresh on step 1
    localStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    mockShifts = [
      { id: '1', employeeId: 'emp1', approved: true, hourly: 50, timing: '2026-07-20T18:00:00.000Z' },
      { id: '2', employeeId: 'emp2', approved: true, hourly: 60, timing: '2026-07-20T18:00:00.000Z' },
    ]
    mockMissions = [
      { id: 'm1', name: 'הצבת ציוד', desc: 'להציב את כל הציוד לפני האירוע', status: 'completed' },
    ]
  })

  it('renders initial step (consumption loss check) and elements correctly', () => {
    const wrapper = mountWizard()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('סגירת אירוע ונעילה')
    expect(wrapper.text()).toContain('בקרת הפסדי צריכה')
  })

  it('shows cashier totals and blocks continue until verified', async () => {
    const wrapper = mountWizard()

    await clickButtonWithText(wrapper, 'המשך') // step 1 -> 2 (cashier)

    expect(wrapper.text()).toContain('אימות קופה')
    expect(wrapper.text()).toContain('₪270.00') // cash: (100 + 200) - (10 + 20)
    expect(wrapper.text()).toContain('₪200.00') // credit: 50 + 150
    expect(wrapper.text()).toContain('₪30.00') // creditTip: 10 + 20
    expect(wrapper.text()).toContain('₪500.00') // grand total

    // Continue is disabled until the verification checkbox is checked
    const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('המשך'))
    expect(continueBtn?.attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(continueBtn?.attributes('disabled')).toBeUndefined()
  })

  it('does not present any cash-count entry - verification only', async () => {
    const wrapper = mountWizard()

    await clickButtonWithText(wrapper, 'המשך') // step 1 -> 2 (cashier)

    expect(wrapper.find('input[type="number"]').exists()).toBe(false)

    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(wrapper.find('input[type="number"]').exists()).toBe(false)
  })

  it('groups the Expense Audit step by paidBy and blocks until reviewed', async () => {
    const wrapper = mountWizard()

    await clickButtonWithText(wrapper, 'המשך') // step 1 -> 2 (cashier)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await clickButtonWithText(wrapper, 'המשך') // step 2 -> 3 (shifts)
    await clickButtonWithText(wrapper, 'המשך') // step 3 -> 4 (expenses)

    expect(wrapper.text()).toContain('בקרת הוצאות קופה')
    expect(wrapper.text()).toContain('בית') // ExpensePaidByLabels.house
    expect(wrapper.text()).toContain('לקוח') // ExpensePaidByLabels.client
    expect(wrapper.text()).toContain('₪150.00') // total: 100 + 50

    const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('המשך'))
    expect(continueBtn?.attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(continueBtn?.attributes('disabled')).toBeUndefined()
  })

  it('shows tips broken down by area and their grand total', async () => {
    const wrapper = mountWizard()

    await goToHourlyTipsStep(wrapper)

    expect(wrapper.text()).toContain('בדיקת שכר שעתי וטיפים')
    expect(wrapper.text()).toContain('בר')
    expect(wrapper.text()).toContain('מלצרים')
    expect(wrapper.text()).toContain('₪70') // grand total: 20+10+15+25
  })

  it('blocks continuing to step 3 when a shift is missing timing', async () => {
    mockShifts = [
      { id: '1', employeeId: 'emp1', approved: true, hourly: 50, timing: '2026-07-20T18:00:00.000Z' },
      { id: '2', employeeId: 'emp2', approved: true, hourly: 60, timing: null },
    ]
    const wrapper = mountWizard()

    await clickButtonWithText(wrapper, 'המשך') // step 1 -> 2 (cashier)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await clickButtonWithText(wrapper, 'המשך') // step 2 -> 3 (shifts)

    expect(wrapper.text()).toContain('אימות משמרות עובדים')

    // Missing-timing shifts hidden behind a collapsible panel
    expect(wrapper.text()).toContain('משמרות ללא זמן מוגדר')

    // Expanding the panel reveals the specific employee
    await clickButtonWithText(wrapper, 'משמרות ללא זמן מוגדר')
    await nextTick()
    expect(wrapper.text()).toContain('Jane Smith')

    const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('המשך'))
    expect(continueBtn?.attributes('disabled')).toBeDefined()
  })

  it('allows continuing past step 3 once every shift has timing set', async () => {
    const wrapper = mountWizard()

    await clickButtonWithText(wrapper, 'המשך') // step 1 -> 2 (cashier)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await clickButtonWithText(wrapper, 'המשך') // step 2 -> 3 (shifts)

    expect(wrapper.text()).toContain('כל משמרות העובדים אושרו ומתוזמנות')

    const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('המשך'))
    expect(continueBtn?.attributes('disabled')).toBeUndefined()
  })

  it('blocks continuing when a shift is missing an hourly rate', async () => {
    mockShifts = [
      { id: '1', employeeId: 'emp1', approved: true, hourly: 50, timing: '2026-07-20T18:00:00.000Z' },
      { id: '2', employeeId: 'emp2', approved: true, hourly: null, timing: '2026-07-20T18:00:00.000Z' },
    ]
    const wrapper = mountWizard()

    await goToHourlyTipsStep(wrapper)

    // Missing-hourly employees hidden behind a collapsible panel
    expect(wrapper.text()).toContain('עובדים ללא תעריף שעתי')

    // Expanding the panel reveals the specific employee
    await clickButtonWithText(wrapper, 'עובדים ללא תעריף שעתי')
    await nextTick()
    expect(wrapper.text()).toContain('Jane Smith')

    const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('המשך'))
    expect(continueBtn?.attributes('disabled')).toBeDefined()
  })

  it('allows continuing once every shift has an hourly rate set', async () => {
    const wrapper = mountWizard()

    await goToHourlyTipsStep(wrapper)

    expect(wrapper.text()).toContain('לכל העובדים הוגדר תעריף שעתי')

    const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('המשך'))
    expect(continueBtn?.attributes('disabled')).toBeUndefined()
  })

  it('blocks locking when missions are incomplete and lists them', async () => {
    mockMissions = [
      { id: 'm1', name: 'הצבת ציוד', desc: 'להציב את כל הציוד לפני האירוע', status: 'completed' },
      { id: 'm2', name: 'פירוק במה', desc: 'לפרק את הבמה בסוף האירוע', status: 'pending' },
    ]
    const wrapper = mountWizard()

    await goToMissionsStep(wrapper)

    expect(wrapper.text()).toContain('בדיקת השלמת משימות')
    expect(wrapper.text()).toContain('פירוק במה')

    const lockBtn = wrapper.findAll('button').find((b) => b.text().includes('נעל אירוע'))
    expect(lockBtn?.attributes('disabled')).toBeDefined()
  })

  it('allows locking once all missions are complete', async () => {
    const wrapper = mountWizard()

    await goToMissionsStep(wrapper)

    expect(wrapper.text()).toContain('כל המשימות הושלמו')

    const lockBtn = wrapper.findAll('button').find((b) => b.text().includes('נעל אירוע'))
    expect(lockBtn?.attributes('disabled')).toBeUndefined()
  })

  it('treats a session with no missions as trivially satisfied', async () => {
    mockMissions = []
    const wrapper = mountWizard()

    await goToMissionsStep(wrapper)

    expect(wrapper.text()).toContain('כל המשימות הושלמו')

    const lockBtn = wrapper.findAll('button').find((b) => b.text().includes('נעל אירוע'))
    expect(lockBtn?.attributes('disabled')).toBeUndefined()
  })

  it('emits submit with no payload when locking the session', async () => {
    const wrapper = mountWizard()

    await goToMissionsStep(wrapper)
    await clickButtonWithText(wrapper, 'נעל אירוע') // lock

    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})
