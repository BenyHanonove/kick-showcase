import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Views fetch through these providers; stub the network away
vi.mock('@session/providers/session.provider', () => ({
  sessionProvider: {
    list: vi.fn().mockResolvedValue({ success: true, data: [], message: '' }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    summary: vi.fn(),
  },
}))

vi.mock('@sale/providers/sale.provider', () => ({
  saleProvider: {
    list: vi.fn().mockResolvedValue({ success: true, data: [], message: '' }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    summary: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import SessionsView from '@session/views/SessionsView.vue'
import SalesView from '@sale/views/SalesView.vue'
import { sessionProvider } from '@session/providers/session.provider'
import { saleProvider } from '@sale/providers/sale.provider'
import { SessionsStore, SalesStore } from '@stores'

// Sunday-based week containing today
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const currentWeek = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return { startDate: dayKey(start), endDate: dayKey(end) }
}

const clickWeekChip = async (wrapper: ReturnType<typeof mount>) => {
  // Scope to the chip group: summary/status chips are also .v-chip
  const chip = wrapper.findAll('.v-chip-group .v-chip').find((c) => c.text().includes('השבוע'))
  expect(chip).toBeTruthy()
  await chip?.trigger('click')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}

describe('Calendar views — date-range chips drive the pinia filters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('seeds the store filters with the current month on mount', () => {
    mount(SessionsView, { global: { stubs: { AppCalendar: true, teleport: true } } })

    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    expect(SessionsStore().filters).toMatchObject({
      monthYear: month,
      startDate: `${month}-01`,
      endDate: `${month}-${String(lastDay).padStart(2, '0')}`,
    })
  })

  it('writes the preset range into the sessions store and refetches', async () => {
    const wrapper = mount(SessionsView, {
      global: { stubs: { AppCalendar: true, teleport: true } },
    })
    await clickWeekChip(wrapper)

    // Regression: the range must reach the store, not just the emit
    expect(SessionsStore().filters).toMatchObject(currentWeek())
    expect(sessionProvider.list).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sessionProvider.list).mock.calls[0]?.[0]).toMatchObject(currentWeek())
  })

  it('writes the preset range into the sales store and refetches', async () => {
    const wrapper = mount(SalesView, {
      global: { stubs: { AppCalendar: true, teleport: true } },
    })
    await clickWeekChip(wrapper)

    expect(SalesStore().filters).toMatchObject(currentWeek())
    expect(saleProvider.list).toHaveBeenCalledTimes(1)
    expect(vi.mocked(saleProvider.list).mock.calls[0]?.[0]).toMatchObject(currentWeek())
  })
})
