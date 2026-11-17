// 単位（次元）の計算と表示
import type { Node } from './expr'

/** 次元の指数。順に 質量 kg, 長さ m, 時間 s, 温度 K, 電流 A */
export type Dim = readonly [number, number, number, number, number]

export const DIMLESS: Dim = [0, 0, 0, 0, 0]
const EPS = 1e-9

export function dimMul(a: Dim, b: Dim): Dim {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4] + b[4]]
}
export function dimDiv(a: Dim, b: Dim): Dim {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3], a[4] - b[4]]
}
export function dimPow(a: Dim, p: number): Dim {
  return [a[0] * p, a[1] * p, a[2] * p, a[3] * p, a[4] * p]
}
export function dimEq(a: Dim, b: Dim): boolean {
  return a.every((x, i) => Math.abs(x - b[i]) < EPS)
}
export function isDimless(a: Dim): boolean {
  return dimEq(a, DIMLESS)
}

export type DimResult =
  | { ok: true; dim: Dim }
  /** add: 次元の違うものを足した / trig: 三角関数の中身に単位がある / exp: 指数が数でない */
  | { ok: false; reason: 'add' | 'trig' | 'exp'; left?: Dim; right?: Dim; leftNode?: Node; rightNode?: Node }

export type DimOf = (name: string) => Dim

/** 指数に使える定数（数、-数、数/数）を評価する。定数でなければ null */
function constValue(n: Node): number | null {
  if (n.t === 'num') return n.v
  if (n.t === 'neg') {
    const v = constValue(n.a)
    return v === null ? null : -v
  }
  if (n.t === 'div') {
    const a = constValue(n.a)
    const b = constValue(n.b)
    return a === null || b === null ? null : a / b
  }
  return null
}

/** 式の次元を求める */
export function dimOf(n: Node, sym: DimOf): DimResult {
  switch (n.t) {
    case 'num':
      return { ok: true, dim: DIMLESS }
    case 'sym':
      return { ok: true, dim: n.name === 'pi' ? DIMLESS : sym(n.name) }
    case 'neg':
      return dimOf(n.a, sym)
    case 'add':
    case 'sub': {
      const a = dimOf(n.a, sym)
      if (!a.ok) return a
      const b = dimOf(n.b, sym)
      if (!b.ok) return b
      if (!dimEq(a.dim, b.dim)) {
        return { ok: false, reason: 'add', left: a.dim, right: b.dim, leftNode: n.a, rightNode: n.b }
      }
      return a
    }
    case 'mul':
    case 'div': {
      const a = dimOf(n.a, sym)
      if (!a.ok) return a
      const b = dimOf(n.b, sym)
      if (!b.ok) return b
      return { ok: true, dim: n.t === 'mul' ? dimMul(a.dim, b.dim) : dimDiv(a.dim, b.dim) }
    }
    case 'pow': {
      const a = dimOf(n.a, sym)
      if (!a.ok) return a
      const e = constValue(n.b)
      if (e === null) return { ok: false, reason: 'exp' }
      return { ok: true, dim: dimPow(a.dim, e) }
    }
    case 'fn': {
      const a = dimOf(n.a, sym)
      if (!a.ok) return a
      if (n.name === 'sqrt') return { ok: true, dim: dimPow(a.dim, 0.5) }
      if (!isDimless(a.dim)) return { ok: false, reason: 'trig' }
      return { ok: true, dim: DIMLESS }
    }
  }
}

// ---- 表示 ----

const BASE_UNITS = ['kg', 'm', 's', 'K', 'A'] as const
const SUP: Record<string, string> = { '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' }

/** 名前のある組立単位。次元がその整数乗に一致したら名前で表示する */
const NAMED: { name: string; dim: Dim }[] = [
  { name: 'Ω', dim: [1, 2, -3, 0, -2] },
]

function powStr(unit: string, e: number): string {
  if (Math.abs(e - 1) < EPS) return unit
  if (Math.abs(e - 0.5) < EPS) return `√${unit}`
  if (Number.isInteger(Math.round(e)) && Math.abs(e - Math.round(e)) < EPS) {
    const k = String(Math.round(e))
    return unit + (SUP[k] ?? `^${k}`)
  }
  // 3/2 など
  const twice = Math.round(e * 2)
  return `${unit}^(${twice}/2)`
}

function namedForm(d: Dim): string | null {
  for (const u of NAMED) {
    // d = p * u.dim となる p を探す
    const idx = u.dim.findIndex((x) => x !== 0)
    const p = d[idx] / u.dim[idx]
    if (Math.abs(p) < EPS) continue
    if (dimEq(d, dimPow(u.dim, p))) {
      return p > 0 ? powStr(u.name, p) : `1/${powStr(u.name, -p)}`
    }
  }
  return null
}

/** 次元を単位の文字列にする（例: m/s², kg·m/s², 1/s, 単位なし） */
export function formatDim(d: Dim): string {
  if (isDimless(d)) return '単位なし'
  const named = namedForm(d)
  if (named) return named
  const num: string[] = []
  const den: string[] = []
  d.forEach((e, i) => {
    if (e > EPS) num.push(powStr(BASE_UNITS[i], e))
    else if (e < -EPS) den.push(powStr(BASE_UNITS[i], -e))
  })
  const top = num.length ? num.join('·') : '1'
  if (!den.length) return top
  const bottom = den.length > 1 ? `(${den.join('·')})` : den[0]
  return `${top}/${bottom}`
}

export type UnitLabel = (name: string) => string

/**
 * 文字を単位に置き換えた途中式を作る（数や三角関数は単位がないので省く）。
 * 単位をもたない部分は null を返す。
 */
export function substituteUnits(n: Node, label: UnitLabel, sym: DimOf): string | null {
  const wrap = (s: string) => (/[ ×÷＋−]/.test(s) ? `(${s})` : s)
  switch (n.t) {
    case 'num':
      return null
    case 'sym': {
      if (n.name === 'pi') return null
      return isDimless(sym(n.name)) ? null : label(n.name)
    }
    case 'neg':
      return substituteUnits(n.a, label, sym)
    case 'add':
    case 'sub': {
      const a = substituteUnits(n.a, label, sym) ?? '単位なし'
      const b = substituteUnits(n.b, label, sym) ?? '単位なし'
      return `${a} ${n.t === 'add' ? '＋' : '−'} ${b}`
    }
    case 'mul': {
      const a = substituteUnits(n.a, label, sym)
      const b = substituteUnits(n.b, label, sym)
      if (a === null) return b
      if (b === null) return a
      const fa = n.a.t === 'add' || n.a.t === 'sub' ? `(${a})` : a
      const fb = n.b.t === 'add' || n.b.t === 'sub' ? `(${b})` : b
      return `${fa} × ${fb}`
    }
    case 'div': {
      const a = substituteUnits(n.a, label, sym)
      const b = substituteUnits(n.b, label, sym)
      if (b === null) return a
      return `${a === null ? '1' : wrap(a)} ÷ ${wrap(b)}`
    }
    case 'pow': {
      const a = substituteUnits(n.a, label, sym)
      if (a === null) return null
      const e = constValue(n.b)
      const k = e !== null && Number.isInteger(e) ? (SUP[String(e)] ?? `^${e}`) : '^?'
      return `${/[ ×÷＋−/]/.test(a) ? `(${a})` : a}${k}`
    }
    case 'fn': {
      if (n.name !== 'sqrt') return null
      const a = substituteUnits(n.a, label, sym)
      return a === null ? null : `√(${a})`
    }
  }
}

/** いちばん外側が √ なら中身を返す（数の係数や π は読み飛ばす） */
function outerSqrt(n: Node): Node | null {
  if (n.t === 'fn' && n.name === 'sqrt') return n.a
  if (n.t === 'mul' && constLike(n.a)) return outerSqrt(n.b)
  return null
}
function constLike(n: Node): boolean {
  if (n.t === 'num') return true
  if (n.t === 'sym') return n.name === 'pi'
  if (n.t === 'mul') return constLike(n.a) && constLike(n.b)
  return false
}

/**
 * 単位の検算の説明（途中式）を作る。
 * 例: √(m ÷ m/s²) ＝ √(s²) ＝ s
 */
export function unitSteps(n: Node, label: UnitLabel, sym: DimOf): string {
  const r = dimOf(n, sym)
  const subst = substituteUnits(n, label, sym)
  if (!r.ok) {
    if (r.reason === 'add' && r.left && r.right) {
      return `${subst ?? ''} → ${formatDim(r.left)} と ${formatDim(r.right)} は足せない`
    }
    return `${subst ?? ''} → 単位が決まらない`
  }
  const final = formatDim(r.dim)
  if (subst === null) return final
  const steps = [subst]
  const inner = outerSqrt(n)
  if (inner) {
    const ir = dimOf(inner, sym)
    if (ir.ok) {
      const mid = `√(${formatDim(ir.dim)})`
      if (mid !== subst) steps.push(mid)
    }
  }
  if (steps[steps.length - 1] !== final) steps.push(final)
  const note = /N/.test(subst) ? '（N ＝ kg·m/s²）' : ''
  return steps.join(' ＝ ') + note
}
