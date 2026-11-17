import { describe, expect, it } from 'vitest'
import katex from 'katex'
import { BANK, failsSomething, level4Situations, nextQuestion, nextQuestion4, poolFor, statementsOf, type Level } from './bank'
import { limitVerdict, makeRng } from './checks'
import { parse } from './expr'
import { dimEq, dimOf } from './dim'
import { symDim } from '../data/symbols'
import type { UnitGroup } from '../data/situations'

const ALL: UnitGroup[] = ['basic', 'mech', 'other']
const byId = (id: string) => BANK.find((s) => s.sit.id === id)!

// 仕様書「収録問題の種」と同じ内容を、データとは別に書き写したもの（数式処理で確認済みの値）
// 単位が合うか：[正しい式, 誤答候補…] の順
const UNIT_OK: Record<string, boolean[]> = {
  S01: [true, false, false, false],
  S02: [true, false, false, false],
  S03: [true, true, true, true, false],
  S04: [true, true, true, false],
  S05: [true, true, false, true],
  S06: [true, true, false, true],
  S07: [true, true, true, true],
  S08: [true, true, false, true],
  S09: [true, true, false, true],
  S10: [true, false, false, false],
  S11: [true, false, false, false],
  S12: [true, true, true, false],
  S13: [true, true, true, true],
  S14: [true, true, true, false],
  S15: [true, true, true, false],
  S16: [true, false, true, true],
  S17: [true, false, false, false],
  S18: [true, true, true, true],
  S19: [true, false, false, false],
  S20: [true, false, false, false],
}
// 極限の検算で不合格になる誤答候補の番号（0始まり）。検算の並び順に対応
const LIMIT_FAILS: Record<string, number[][]> = {
  S03: [[0, 1], [0, 2, 3]],
  S04: [[1]],
  S05: [[0, 2], [1]],
  S06: [[0], [1, 2]],
  S07: [[0], [0, 1, 2]],
  S08: [[0], [0, 1, 2]],
  S09: [[0], [0, 2]],
  S12: [[0, 2], [0, 1]],
  S13: [[0, 1], [0, 2], [1, 2]],
  S14: [[0], [1, 2], [1, 2]],
  S15: [[0, 1, 2], [2], [2]],
  S16: [[0, 1, 2], [0, 2], [0, 1, 2]],
  S18: [[2], [0, 1]],
}
// 増減の検算で不合格になる誤答候補：[状況, 動かす文字, 誤答番号]
const TREND_FAILS: [string, string, number][] = [
  ['S01', 'h', 2], ['S02', 'h', 2], ['S04', 'mu', 0],
  ['S10', 'm', 0], ['S10', 'k', 0], ['S10', 'k', 2], ['S11', 'L', 0],
  ['S13', 'M', 0], ['S13', 'M', 2], ['S17', 'St', 0], ['S17', 'L', 1],
  ['S18', 'v', 0], ['S18', 'v', 1], ['S20', 'r', 0], ['S20', 'M', 0],
]

describe('収録問題の自動検証', () => {
  it('20状況・計81式がある', () => {
    expect(BANK.length).toBe(20)
    expect(BANK.reduce((n, s) => n + s.all.length, 0)).toBe(81)
  })

  it('正しい式は、単位とすべての検算に合格する', () => {
    for (const s of BANK) {
      expect(s.correct.unitOk, `${s.sit.id} 単位`).toBe(true)
      s.correct.checks.forEach((c, i) => {
        expect(c.usable, `${s.sit.id} 検算${i} が判定不能`).toBe(true)
        expect(c.pass, `${s.sit.id} 検算${i}`).toBe(true)
      })
    }
  })

  it('誤答候補は、単位か検算の少なくとも1つで不合格になる', () => {
    for (const s of BANK) for (const w of s.wrongs) expect(failsSomething(w), `${s.sit.id} ${w.src}`).toBe(true)
  })

  it('単位の合否が仕様書の表と一致する', () => {
    for (const s of BANK) {
      expect(s.all.map((e) => e.unitOk), s.sit.id).toEqual(UNIT_OK[s.sit.id])
    }
  })

  it('極限の合否が仕様書の表と一致する', () => {
    for (const s of BANK) {
      const limitIdx = s.sit.checks.map((c, i) => (c.type === 'limit' ? i : -1)).filter((i) => i >= 0)
      const want = LIMIT_FAILS[s.sit.id] ?? []
      expect(limitIdx.length, `${s.sit.id} の極限の数`).toBe(want.length)
      limitIdx.forEach((ci, k) => {
        const fails = s.wrongs.map((w, wi) => (w.checks[ci].pass ? -1 : wi)).filter((i) => i >= 0)
        expect(fails, `${s.sit.id} 極限${k}`).toEqual(want[k])
        for (const w of s.wrongs) expect(w.checks[ci].usable, `${s.sit.id} ${w.src} 極限${k} が判定不能`).toBe(true)
      })
    }
  })

  it('増減の合否が仕様書の表と一致する', () => {
    for (const [id, v, wi] of TREND_FAILS) {
      const s = byId(id)
      const ci = s.sit.checks.findIndex((c) => c.type === 'trend' && c.v === v)
      expect(ci, `${id} ${v}`).toBeGreaterThanOrEqual(0)
      const r = s.wrongs[wi].checks[ci]
      expect(r.usable && !r.pass, `${id} ${v} 誤答${wi}`).toBe(true)
    }
  })

  it('不合格になる極限には、説明用の値（gives）があり、数値と一致する', () => {
    for (const s of BANK) {
      s.sit.checks.forEach((c, ci) => {
        if (c.type !== 'limit') return
        for (const w of s.wrongs) {
          const r = w.checks[ci]
          if (r.type !== 'limit' || r.pass) {
            expect(c.gives?.[w.src], `${s.sit.id} ${w.src}: 合格なのに gives がある`).toBeUndefined()
            continue
          }
          const g = c.gives?.[w.src]
          expect(g, `${s.sit.id} ${c.cond} ${w.src}: gives がない`).toBeDefined()
          if (g === 'inf') {
            expect(r.becomes).toBe('inf')
          } else {
            const v = limitVerdict(parse(w.src), c.v, c.to, c.side ?? 'above', g!, s.sit.vars, s.sit.sampling, 12345)
            expect(v, `${s.sit.id} ${c.cond} ${w.src} → ${g}`).toEqual({ kind: 'finite', matches: true })
          }
        }
      })
    }
  })

  it('次元の異なる項の足し算は「足せない」で不合格', () => {
    const e = byId('S04').wrongs.find((w) => w.src === 'g*sin(th) - mu')!
    expect(e.unitOk).toBe(false)
    expect(e.unitError).toBe('add')
  })

  it('単位の途中式（S01〜S03）', () => {
    const steps = (id: string) => byId(id).all.map((e) => e.unitSteps)
    expect(steps('S01')).toEqual([
      '√(m ÷ m/s²) ＝ √(s²) ＝ s',
      '√(m/s² × m) ＝ √(m²/s²) ＝ m/s',
      'm ÷ m/s² ＝ s²',
      '√(m/s² ÷ m) ＝ √(1/s²) ＝ 1/s',
    ])
    expect(steps('S02')).toEqual([
      '√(m/s² × m) ＝ √(m²/s²) ＝ m/s',
      'm/s² × m ＝ m²/s²',
      '√(m ÷ m/s²) ＝ √(s²) ＝ s',
      '√(m/s² ÷ m) ＝ √(1/s²) ＝ 1/s',
    ])
    expect(steps('S03')).toEqual(['m/s²', 'm/s²', 'm/s²', 'm/s²', 'kg × m/s² ＝ kg·m/s²'])
  })

  it('すべての式を KaTeX で描画できる', () => {
    for (const s of BANK) {
      for (const e of s.all) {
        expect(() => katex.renderToString(e.tex, { throwOnError: true }), `${s.sit.id} ${e.src}`).not.toThrow()
      }
      for (const e of s.all) for (const c of e.checks) {
        if (c.type === 'limit' && c.becomesTex) {
          expect(() => katex.renderToString(c.becomesTex!, { throwOnError: true })).not.toThrow()
        }
      }
    }
  })
})

describe('レベル2・3の説明（正しい式を前提に、説明の正誤を判定する）', () => {
  it('極限：期待値の説明は正しく、それ以外の候補はすべて誤り', () => {
    let n = 0
    for (const s of BANK) {
      s.sit.checks.forEach((c, i) => {
        if (c.type !== 'limit') return
        const st = statementsOf(s, i)
        expect(st.length, `${s.sit.id} ${c.cond}`).toBe(1 + c.alts.length)
        expect(st[0].key).toBe(c.expect)
        expect(st[0].truth, `${s.sit.id} ${c.cond} の正しい説明`).toBe(true)
        for (const x of st.slice(1)) expect(x.truth, `${s.sit.id} ${c.cond} の誤った説明 ${x.key}`).toBe(false)
        n++
      })
    }
    expect(n).toBe(29)
  })

  it('極限：誤った説明に使う値も、求めたい量と同じ単位をもつ', () => {
    for (const s of BANK) for (const c of s.sit.checks) {
      if (c.type !== 'limit') continue
      for (const a of c.alts) {
        if (a === '0' || a === 'inf') continue
        const d = dimOf(parse(a), symDim)
        expect(d.ok && dimEq(d.dim, s.sit.target.dim), `${s.sit.id} ${c.cond} ${a}`).toBe(true)
      }
    }
  })

  it('増減：3つの説明のうち、正しいのはちょうど1つ', () => {
    let n = 0
    for (const s of BANK) {
      s.sit.checks.forEach((c, i) => {
        if (c.type !== 'trend') return
        const st = statementsOf(s, i)
        expect(st.length, `${s.sit.id} ${c.v}`).toBe(3)
        expect(st.filter((x) => x.truth).map((x) => x.key), `${s.sit.id} ${c.v}`).toEqual([c.expect])
        n++
      })
    }
    expect(n).toBe(35)
  })

  it('レベル2・3で表示する式は、必ず正しい式', () => {
    for (const level of [2, 3] as Level[]) {
      const pool = poolFor(level, ALL)
      expect(pool.length).toBeGreaterThan(50)
      for (const p of pool) {
        expect(p.expr.isCorrect, p.id).toBe(true)
        expect(p.statement, p.id).not.toBeNull()
      }
    }
  })
})

describe('出題', () => {
  it('レベル1〜3：○と×がおよそ半々、同じ状況が続かない', () => {
    for (const level of [1, 2, 3] as Level[]) {
      const rng = makeRng(100 + level)
      let pass = 0
      let prev: string | null = null
      for (let i = 0; i < 1000; i++) {
        const q = nextQuestion(level, ALL, prev, rng)
        if (q.answer) pass++
        expect(q.expr.sit.id).not.toBe(prev)
        prev = q.expr.sit.id
      }
      expect(pass / 1000, `レベル${level}`).toBeGreaterThan(0.4)
      expect(pass / 1000, `レベル${level}`).toBeLessThan(0.6)
    }
  })

  it('どの単元の選び方でも、レベル1〜3に○と×の両方の問題がある', () => {
    const groups: UnitGroup[][] = [['basic'], ['mech'], ['other'], ALL]
    for (const g of groups) for (const level of [1, 2, 3] as Level[]) {
      const pool = poolFor(level, g)
      expect(pool.some((p) => p.answer), `${g} L${level} ○`).toBe(true)
      expect(pool.some((p) => !p.answer), `${g} L${level} ×`).toBe(true)
    }
  })

  it('レベル4：正解1つ＋検算で落とせる誤答3つ', () => {
    expect(level4Situations(ALL).length).toBe(20)
    const rng = makeRng(7)
    for (let i = 0; i < 300; i++) {
      const q = nextQuestion4(ALL, [], rng)
      expect(q.options.length).toBe(4)
      expect(q.options.filter((e) => e.isCorrect).length).toBe(1)
      expect(q.options[q.correctIndex].isCorrect).toBe(true)
      for (const e of q.options) if (!e.isCorrect) expect(failsSomething(e)).toBe(true)
    }
  })
})
