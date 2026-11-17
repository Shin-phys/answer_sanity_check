// 記録の保存（端末内のみ）。localStorage が使えなくてもアプリは動く。

export type Attempt = {
  /** 日時（ISO形式） */
  at: string
  level: 1 | 2 | 3 | 4 | 5
  units: string[]
  /** タイム（ミリ秒）。レベル4・5は 0 */
  timeMs: number
  correct: number
  wrong: number
  /** 間違えた問題のID */
  wrongIds: string[]
  /** レベル1：単位カードあり／レベル4：検算ボタンを使った回数 */
  extra?: { card?: boolean; checksUsed?: number }
}

const KEY = 'answer_sanity_check.attempts.v1'
const MAX = 200

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? (data as Attempt[]) : []
  } catch {
    return []
  }
}

export function saveAttempt(a: Attempt): Attempt[] {
  const all = [...loadAttempts(), a].slice(-MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 保存できなくても続行する
  }
  return all
}

export function clearAttempts(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 何もしない
  }
}

/** そのレベルの自己ベスト（ミリ秒）。記録がなければ null */
export function bestTime(attempts: Attempt[], level: number): number | null {
  const ts = attempts.filter((a) => a.level === level && a.timeMs > 0).map((a) => a.timeMs)
  return ts.length ? Math.min(...ts) : null
}

export const formatTime = (ms: number) => (ms / 1000).toFixed(1)
