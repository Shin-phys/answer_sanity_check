// 文字の定義：表示（TeX・ふつうの文字）、単位、次元
import type { Dim } from '../core/dim'

export type SymbolDef = {
  /** KaTeX 用の表記 */
  tex: string
  /** 文章の中で使う表記 */
  plain: string
  /** 単位の表示（単位なしは空文字） */
  unit: string
  /** 次元 [kg, m, s, K, A] */
  dim: Dim
}

const L: Dim = [0, 1, 0, 0, 0]
const T: Dim = [0, 0, 1, 0, 0]
const V: Dim = [0, 1, -1, 0, 0]
const A: Dim = [0, 1, -2, 0, 0]
const M: Dim = [1, 0, 0, 0, 0]
const F: Dim = [1, 1, -2, 0, 0]
const NONE: Dim = [0, 0, 0, 0, 0]
const TEMP: Dim = [0, 0, 0, 1, 0]
const OHM: Dim = [1, 2, -3, 0, -2]

export const DIMS = { L, T, V, A, M, F, NONE, TEMP, OHM, FREQ: [0, 0, -1, 0, 0] as Dim }

export const SYMBOLS: Record<string, SymbolDef> = {
  h: { tex: 'h', plain: 'h', unit: 'm', dim: L },
  L: { tex: 'L', plain: 'L', unit: 'm', dim: L },
  R: { tex: 'R', plain: 'R', unit: 'm', dim: L },
  r: { tex: 'r', plain: 'r', unit: 'm', dim: L },
  x: { tex: 'x', plain: 'x', unit: 'm', dim: L },
  t: { tex: 't', plain: 't', unit: 's', dim: T },
  v: { tex: 'v', plain: 'v', unit: 'm/s', dim: V },
  v0: { tex: 'v_0', plain: 'v₀', unit: 'm/s', dim: V },
  V: { tex: 'V', plain: 'V', unit: 'm/s', dim: V },
  g: { tex: 'g', plain: 'g', unit: 'm/s²', dim: A },
  m: { tex: 'm', plain: 'm', unit: 'kg', dim: M },
  M: { tex: 'M', plain: 'M', unit: 'kg', dim: M },
  m1: { tex: 'm_1', plain: 'm₁', unit: 'kg', dim: M },
  m2: { tex: 'm_2', plain: 'm₂', unit: 'kg', dim: M },
  St: { tex: 'S', plain: 'S', unit: 'N', dim: F },
  k: { tex: 'k', plain: 'k', unit: 'N/m', dim: [1, 0, -2, 0, 0] },
  rho: { tex: '\\rho', plain: 'ρ', unit: 'kg/m', dim: [1, -1, 0, 0, 0] },
  f: { tex: 'f', plain: 'f', unit: 'Hz', dim: [0, 0, -1, 0, 0] },
  G: { tex: 'G', plain: 'G', unit: 'N·m²/kg²', dim: [-1, 3, -2, 0, 0] },
  T1: { tex: 'T_1', plain: 'T₁', unit: 'K', dim: TEMP },
  T2: { tex: 'T_2', plain: 'T₂', unit: 'K', dim: TEMP },
  R1: { tex: 'R_1', plain: 'R₁', unit: 'Ω', dim: OHM },
  R2: { tex: 'R_2', plain: 'R₂', unit: 'Ω', dim: OHM },
  th: { tex: '\\theta', plain: 'θ', unit: '', dim: NONE },
  mu: { tex: "\\mu'", plain: 'μ′', unit: '', dim: NONE },
}

export function symDef(name: string): SymbolDef {
  const d = SYMBOLS[name]
  if (!d) throw new Error(`定義されていない文字です: ${name}`)
  return d
}
export const symTex = (name: string) => symDef(name).tex
export const symDim = (name: string) => symDef(name).dim
export const symUnit = (name: string) => symDef(name).unit
