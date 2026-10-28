import { describe, it, expect } from 'vitest'
import { ref, type Ref } from 'vue'
import { useSearch } from '@shared/composables/useSearch.composable'

describe('useSearch composable', () => {
  interface TestItem {
    id: number
    firstName: string
    lastName: string
    identityNumber?: string
  }

  const sampleItems: TestItem[] = [
    { id: 1, firstName: 'דני', lastName: 'כהן', identityNumber: '123456789' },
    { id: 2, firstName: 'יוסי', lastName: 'לוי', identityNumber: '987654321' },
    { id: 3, firstName: 'שרה', lastName: 'אברהם', identityNumber: '112233445' },
  ]

  it('returns full list when query is empty', () => {
    const items = ref(sampleItems)
    const { results } = useSearch(items, ['firstName', 'lastName', 'identityNumber'])

    expect(results.value).toEqual(sampleItems)
    expect(results.value.length).toBe(3)
  })

  it('filters items correctly based on search keys', () => {
    const items = ref(sampleItems)
    const { query, results } = useSearch(items, ['firstName', 'lastName', 'identityNumber'])

    query.value = 'דני'
    expect(results.value.length).toBe(1)
    expect(results.value[0].firstName).toBe('דני')

    query.value = '9876'
    expect(results.value.length).toBe(1)
    expect(results.value[0].firstName).toBe('יוסי')
  })

  it('handles null query without throwing an error (e.g. Vuetify clearable reset)', () => {
    const items = ref(sampleItems)
    const { query, results } = useSearch(items, ['firstName', 'lastName', 'identityNumber'])

    query.value = 'דני'
    expect(results.value.length).toBe(1)

    // Simulate Vuetify's clearable emitting null
    query.value = null as unknown as string

    expect(() => results.value).not.toThrow()
    expect(results.value).toEqual(sampleItems)
    expect(results.value.length).toBe(3)
  })

  it('handles undefined query without throwing an error', () => {
    const items = ref(sampleItems)
    const { query, results } = useSearch(items, ['firstName', 'lastName'])

    query.value = undefined as unknown as string

    expect(() => results.value).not.toThrow()
    expect(results.value).toEqual(sampleItems)
  })

  it('handles empty string and whitespace-only query', () => {
    const items = ref(sampleItems)
    const { query, results } = useSearch(items, ['firstName', 'lastName'])

    query.value = '   '
    expect(results.value).toEqual(sampleItems)

    query.value = ''
    expect(results.value).toEqual(sampleItems)
  })

  it('handles null or undefined items list safely', () => {
    const items = ref<TestItem[] | null>(null)
    const { query, results } = useSearch(items, ['firstName', 'lastName'])

    expect(() => results.value).not.toThrow()
    expect(results.value).toEqual([])

    query.value = 'test'
    expect(() => results.value).not.toThrow()
    expect(results.value).toEqual([])
  })

  it('handles items containing null or undefined elements safely', () => {
    const itemsWithHoles = ref<(TestItem | null | undefined)[]>([
      { id: 1, firstName: 'דני', lastName: 'כהן' },
      null,
      undefined,
      { id: 2, firstName: 'יוסי', lastName: 'לוי' },
    ])

    const { query, results } = useSearch(
      itemsWithHoles as unknown as Ref<TestItem[]>,
      ['firstName', 'lastName'],
    )

    query.value = 'דני'
    expect(() => results.value).not.toThrow()
    expect(results.value.length).toBe(1)
    expect((results.value[0] as TestItem).firstName).toBe('דני')
  })
})
