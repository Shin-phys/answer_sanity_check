// 「正しい式」が本当に正しいかを、基本法則に代入して数値で確かめる。
// 収録した式そのもの（src/data/situations.ts の correct）を評価して使う。
import { describe, expect, it } from 'vitest'
import { BANK } from './bank'
import { evaluate, type Env } from './expr'
import { makeRng } from './checks'

const f = (id: string, env: Env) => evaluate(BANK.find((s) => s.sit.id === id)!.correct.node, env)
const close = (a: number, b: number, label: string) =>
  expect(Math.abs(a - b), `${label}: ${a} と ${b}`).toBeLessThan(1e-9 * Math.max(1, Math.abs(a), Math.abs(b)))

describe('正しい式が基本法則を満たす', () => {
  const rng = makeRng(2026)
  const r = (lo = 0.5, hi = 3) => lo + (hi - lo) * rng()

  it('20の式すべて（乱数50組）', () => {
    for (let i = 0; i < 50; i++) {
      const g = r(5, 15)
      const th = r(0.2, 1.3)
      const mu = r(0.05, 0.2)
      const h = r()
      const m = r()
      const M = m + r(0.2, 2)
      const v = r()
      const v0 = r(1, 10)
      const k = r(1, 50)
      const L = r()

      // S01・S02 自由落下：h = g t²/2、v² = 2gh
      const t = f('S01', { h, g })
      close(0.5 * g * t * t, h, 'S01')
      close(f('S02', { h, g }) ** 2, 2 * g * h, 'S02')

      // S03・S04 斜面：ma = mg sinθ（− μ′mg cosθ）
      close(m * f('S03', { g, th }), m * g * Math.sin(th), 'S03')
      close(m * f('S04', { g, th: 1.0, mu }), m * g * Math.sin(1.0) - mu * m * g * Math.cos(1.0), 'S04')

      // S05・S06 定滑車：Ma = Mg − S、ma = S − mg を同時に満たす
      const a5 = f('S05', { M, m, g })
      const S6 = f('S06', { M, m, g })
      close(M * a5, M * g - S6, 'S05/S06（M の運動方程式）')
      close(m * a5, S6 - m * g, 'S05/S06（m の運動方程式）')

      // S07 台車とおもり：台車 Ma = S、おもり ma = mg − S
      const a7 = f('S07', { M, m, g })
      close(m * a7, m * g - M * a7, 'S07')

      // S08・S09 斜方投射：0 = (v₀sinθ)² − 2gH、x = v₀cosθ × (2v₀sinθ/g)
      close((v0 * Math.sin(th)) ** 2, 2 * g * f('S08', { v0, th, g }), 'S08')
      close(f('S09', { v0, th, g }), v0 * Math.cos(th) * ((2 * v0 * Math.sin(th)) / g), 'S09')

      // S10・S11 単振動：ω² = k/m、ω² = g/L
      close((2 * Math.PI / f('S10', { m, k })) ** 2, k / m, 'S10')
      close((2 * Math.PI / f('S11', { L, g })) ** 2, g / L, 'S11')

      // S12 円錐振り子：S cosθ = mg、S sinθ = m (L sinθ) ω²
      const w12 = (2 * Math.PI) / f('S12', { L, th, g })
      const S12 = (m * g) / Math.cos(th)
      close(S12 * Math.sin(th), m * L * Math.sin(th) * w12 * w12, 'S12')

      // S13 一体となる衝突：運動量保存
      close(m * v, (M + m) * f('S13', { m, M, v }), 'S13')

      // S14 弾性衝突：運動量保存と力学的エネルギー保存
      const v1 = f('S14', { m, M, v })
      const V2 = (m * v - m * v1) / M
      close(0.5 * m * v * v, 0.5 * m * v1 * v1 + 0.5 * M * V2 * V2, 'S14（エネルギー）')
      close(v, V2 - v1, 'S14（はねかえり係数 1）')

      // S15 熱量の保存：m₁(T − T₁) + m₂(T − T₂) = 0
      const m1 = r(), m2 = r(), T1 = r(280, 300), T2 = r(310, 360)
      const Tm = f('S15', { m1, T1, m2, T2 })
      close(m1 * (Tm - T1) + m2 * (Tm - T2), 0, 'S15')

      // S16 並列：1/R = 1/R₁ + 1/R₂
      const R1 = r(1, 100), R2 = r(1, 100)
      close(1 / f('S16', { R1, R2 }), 1 / R1 + 1 / R2, 'S16')

      // S17 弦：波の速さ √(S/ρ)、基本振動の波長 2L
      const St = r(1, 20), rho = r(0.001, 0.01)
      close(f('S17', { L, St, rho }) * 2 * L, Math.sqrt(St / rho), 'S17')

      // S18 ドップラー効果：前方の波長 (V − v)/f、聞こえる振動数 V/波長
      const V = 340, vs = r(1, 100), f0 = r(100, 1000)
      close(f('S18', { f: f0, V, v: vs }), V / ((V - vs) / f0), 'S18')

      // S19 第一宇宙速度：m v²/R = mg
      const R = r(1e6, 1e7)
      close(f('S19', { g, R }) ** 2 / R, g, 'S19')

      // S20 円軌道：GMm/r² = m r (2π/T)²
      const G = 6.67e-11, Ms = r(1e23, 1e25), rr = r(1e7, 1e8)
      const T20 = f('S20', { r: rr, G, M: Ms })
      close((G * Ms) / rr ** 2, rr * ((2 * Math.PI) / T20) ** 2, 'S20')
    }
  })
})
