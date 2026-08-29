export type ReadingState =
  | 'want_to_read'
  | 'unread'
  | 'reading'
  | 'completed'
  | 'abandoned'

export type ReadingAction =
  | 'acquire'
  | 'start'
  | 'complete'
  | 'abandon'
  | 'return_to_unread'
  | 'return_to_want_to_read'

export class DomainRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainRuleError'
  }
}

/** Applies a user-visible reading action without mutating persistence. */
export function transitionReadingState(
  state: ReadingState,
  action: ReadingAction,
  options: { hasInProgressSession?: boolean } = {},
): ReadingState {
  const hasInProgress = options.hasInProgressSession ?? state === 'reading'

  if (action === 'start') {
    if (hasInProgress) {
      throw new DomainRuleError('この本には進行中の読書記録があります')
    }
    if (!['want_to_read', 'unread', 'completed', 'abandoned'].includes(state)) {
      throw new DomainRuleError('この状態から読書を開始できません')
    }
    return 'reading'
  }

  if (state === 'reading') {
    if (action === 'complete') return 'completed'
    if (action === 'abandon') return 'abandoned'
    if (action === 'return_to_unread' || action === 'return_to_want_to_read') {
      if (!hasInProgress) throw new DomainRuleError('進行中の読書記録がありません')
      return action === 'return_to_unread' ? 'unread' : 'want_to_read'
    }
    throw new DomainRuleError('読書中は中断または完了として保存してください')
  }

  if (action === 'acquire' && state === 'want_to_read') return 'unread'
  throw new DomainRuleError('許可されていない読書状態の遷移です')
}

export type DatePrecision = 'day' | 'month' | 'year' | 'unknown'
export type PartialDate = { date: string | null; precision: DatePrecision }
export type Period = { year: number; month?: number; day?: number }

const precisionRank: Record<DatePrecision, number> = {
  unknown: 0,
  year: 1,
  month: 2,
  day: 3,
}

/** A date is eligible only when it can prove the requested period. */
export function isPeriodEligible(
  partial: PartialDate,
  period: Period,
): boolean {
  if (!partial.date || partial.precision === 'unknown') return false
  if (precisionRank[partial.precision] < (period.day ? 3 : period.month ? 2 : 1)) {
    return false
  }
  const [year, month, day] = partial.date.split('-').map(Number)
  if (year !== period.year) return false
  if (period.month !== undefined && month !== period.month) return false
  if (period.day !== undefined && day !== period.day) return false
  return true
}

export function isKnownDate(partial: PartialDate): boolean {
  return partial.precision !== 'unknown' && partial.date !== null
}
