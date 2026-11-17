// 極限と増減の数値判定
import { evaluate, parse, symbolsOf, type Env, type Node } from './expr'

/** 再現性のある乱数（mulberry32） */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 乱数の取り方の制約 */
export type Sampling = {
  /** 文字ごとの範囲。指定がなければ 0.5〜3 */
  ranges?: Record<string, [number, number]>
  /** [大きい方, 小さい方] の組。例: [['M','m']] は M > m */
  greater?: [string, string][]
}

const DEFAULT_RANGE: [number, number] = [0.5, 3]

/** 物理的に意味のある範囲で、文字に乱数を割り当てる */
export function sampleEnv(vars: string[], s: Sampling, rng: () => number): Env {
  const env: Env = {}
  for (const v of vars) {
    const [lo, hi] = s.ranges?.[v] ?? DEFAULT_RANGE
    env[v] = lo + (hi - lo) * rng()
  }
  for (const [big, small] of s.greater ?? []) {
    if (big in env && small in env) env[big] = env[small] + 0.5 + 1.5 * rng()
  }
  return env
}

export type LimitTarget = '0' | 'inf' | string

export type LimitOutcome = { kind: 'finite'; value: number; ref: number } | { kind: 'inf' }

const STEPS = [1e-6, 1e-8]

/**
 * 文字 v を target に近づけたときの式のふるまいを、1組の乱数で調べる。
 * target: '0'（0へ）, 'inf'（無限大へ）, それ以外は式（例 'm', 'pi/2'）
 * side: 'above'（大きい側から）か 'below'（小さい側から）
 */
export function limitOnce(
  expr: Node,
  v: string,
  target: LimitTarget,
  side: 'above' | 'below',
  env: Env,
): LimitOutcome {
  const ref = Math.abs(evaluate(expr, env))
  const ys = STEPS.map((d) => {
    const e = { ...env }
    if (target === '0') e[v] = d
    else if (target === 'inf') e[v] = 1 / d
    else {
      const t = evaluate(parse(target), env)
      e[v] = side === 'above' ? t * (1 + d) : t * (1 - d)
    }
    return evaluate(expr, e)
  })
  const [y1, y2] = ys.map(Math.abs)
  const scale = Math.max(ref, 1e-12)
  if (!Number.isFinite(y2) || (y2 > 5 * y1 && y2 > 1e3 * scale)) return { kind: 'inf' }
  return { kind: 'finite', value: ys[1], ref: scale }
}

export type LimitVerdict =
  | { kind: 'inf' }
  /** matches: 期待した式の値と一致したか */
  | { kind: 'finite'; matches: boolean }
  | { kind: 'unstable' }

/**
 * 極限の判定。3組の乱数すべてで同じ結果になったときだけ結論を出す。
 * expect: 期待される式（'inf' なら無限大）
 */
export function limitVerdict(
  expr: Node,
  v: string,
  target: LimitTarget,
  side: 'above' | 'below',
  expect: string,
  vars: string[],
  sampling: Sampling,
  seed: number,
): LimitVerdict {
  const rng = makeRng(seed)
  const all = Array.from(new Set([...vars, ...symbolsOf(expr)]))
  const results: LimitVerdict[] = []
  for (let i = 0; i < 3; i++) {
    const env = sampleEnv(all, sampling, rng)
    const out = limitOnce(expr, v, target, side, env)
    if (out.kind === 'inf') {
      results.push({ kind: 'inf' })
      continue
    }
    if (expect === 'inf') {
      results.push({ kind: 'finite', matches: false })
      continue
    }
    // 期待値は、近づけた先の値を入れた環境で評価する
    const e2 = { ...env }
    if (target === '0') e2[v] = 0
    else if (target === 'inf') e2[v] = Number.MAX_VALUE
    else e2[v] = evaluate(parse(target), env)
    const want = evaluate(parse(expect), e2)
    const tol = 1e-3 * Math.max(Math.abs(want), out.ref)
    results.push({ kind: 'finite', matches: Math.abs(out.value - want) <= tol })
  }
  const first = results[0]
  const same = results.every(
    (r) => r.kind === first.kind && (r.kind !== 'finite' || r.matches === (first as { matches: boolean }).matches),
  )
  return same ? first : { kind: 'unstable' }
}

export type Trend = 'up' | 'down' | 'flat' | 'mixed'

/** 文字 v を 1.1 倍にしたときの式の値の動き。6組の乱数すべてで向きがそろえばその向き */
export function trendOf(expr: Node, v: string, vars: string[], sampling: Sampling, seed: number): Trend {
  const rng = makeRng(seed)
  const all = Array.from(new Set([...vars, ...symbolsOf(expr)]))
  const seen = new Set<Trend>()
  for (let i = 0; i < 6; i++) {
    const env = sampleEnv(all, sampling, rng)
    const a = evaluate(expr, env)
    const b = evaluate(expr, { ...env, [v]: env[v] * 1.1 })
    const tol = 1e-9 * Math.max(Math.abs(a), Math.abs(b), 1e-12)
    seen.add(b > a + tol ? 'up' : b < a - tol ? 'down' : 'flat')
  }
  return seen.size === 1 ? [...seen][0] : 'mixed'
}
