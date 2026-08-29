import { describe, expect, it } from 'vitest'
import {
  DomainRuleError,
  isKnownDate,
  isPeriodEligible,
  transitionReadingState,
} from './reading'

describe('reading state transitions', () => {
  it('allows direct start and completion', () => {
    expect(transitionReadingState('want_to_read', 'acquire')).toBe('unread')
    expect(transitionReadingState('want_to_read', 'start')).toBe('reading')
    expect(transitionReadingState('reading', 'complete')).toBe('completed')
  })

  it('allows abandonment and rereading completed or abandoned works', () => {
    expect(transitionReadingState('reading', 'abandon')).toBe('abandoned')
    expect(transitionReadingState('completed', 'start')).toBe('reading')
    expect(transitionReadingState('abandoned', 'start')).toBe('reading')
  })

  it('forbids a second in-progress session', () => {
    expect(() => transitionReadingState('completed', 'start', { hasInProgressSession: true })).toThrow(
      DomainRuleError,
    )
  })

  it('requires an explicit decision when leaving reading', () => {
    expect(() => transitionReadingState('reading', 'acquire')).toThrow(DomainRuleError)
    expect(transitionReadingState('reading', 'return_to_unread')).toBe('unread')
    expect(transitionReadingState('reading', 'return_to_want_to_read')).toBe('want_to_read')
  })

  it('rejects invalid actions from non-reading states', () => {
    expect(() => transitionReadingState('unread', 'complete')).toThrow(DomainRuleError)
    expect(() => transitionReadingState('completed', 'acquire')).toThrow(DomainRuleError)
    expect(() => transitionReadingState('want_to_read', 'return_to_unread')).toThrow(DomainRuleError)
  })
})

describe('partial-date eligibility', () => {
  it('uses only dates precise enough for a period', () => {
    expect(isPeriodEligible({ date: '2024-01-01', precision: 'year' }, { year: 2024 })).toBe(true)
    expect(isPeriodEligible({ date: '2024-01-01', precision: 'year' }, { year: 2024, month: 1 })).toBe(false)
    expect(isPeriodEligible({ date: '2024-05-01', precision: 'month' }, { year: 2024, month: 5 })).toBe(true)
    expect(isPeriodEligible({ date: '2024-05-01', precision: 'month' }, { year: 2024, month: 5, day: 1 })).toBe(false)
    expect(isPeriodEligible({ date: '2024-05-10', precision: 'day' }, { year: 2024, month: 5, day: 10 })).toBe(true)
    expect(isPeriodEligible({ date: '2024-05-10', precision: 'day' }, { year: 2024, month: 5, day: 11 })).toBe(false)
    expect(isPeriodEligible({ date: '2024-05-10', precision: 'day' }, { year: 2023 })).toBe(false)
  })

  it('keeps unknown dates out of periods but available to totals', () => {
    const unknown = { date: null, precision: 'unknown' as const }
    expect(isPeriodEligible(unknown, { year: 2024 })).toBe(false)
    expect(isKnownDate(unknown)).toBe(false)
    expect(isKnownDate({ date: '2024-01-01', precision: 'year' })).toBe(true)
  })
})
