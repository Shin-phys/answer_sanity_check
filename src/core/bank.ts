// 収録問題の各式について、単位・極限・増減の合否を計算し、出題を組み立てる
import { parse, symbolsOf, toTex, type Node } from './expr'
import { dimEq, dimOf, formatDim, unitSteps } from './dim'
import { limitVerdict, trendOf, type Trend } from './checks'
import { SITUATIONS, type Check, type Situation, type UnitGroup } from '../data/situations'
import { symDef, symDim, symTex, symUnit } from '../data/symbols'

/** 文章と数式がまざった表示用の部品 */
export type Part = string | { tex: string }

export type CheckResult =
  | { type: 'limit'; pass: boolean; usable: boolean; becomes: 'inf' | 'value' | 'unknown'; becomesTex?: string }
  | { type: 'trend'; pass: boolean; usable: boolean; trend: Trend }

export type ExprInfo = {
  sit: Situation
  src: string
  node: Node
  tex: string
  isCorrect: boolean
  unitOk: boolean
  /** 単位が決まらない理由（足せない など）。決まるときは null */
  unitError: 'add' | 'trig' | 'exp' | null
  /** この式の単位（決まらないときは空） */
  unitText: string
  /** 単位の途中式 */
  unitSteps: string
  /** sit.checks と同じ順 */
  checks: CheckResult[]
}

const tex = (src: string) => toTex(parse(src), symTex)

function seedOf(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function analyzeCheck(sit: Situation, src: string, node: Node, c: Check, idx: number): CheckResult {
  const seed = seedOf(`${sit.id}|${src}|${idx}`)
  if (c.type === 'trend') {
    const trend = trendOf(node, c.v, sit.vars, sit.sampling, seed)
    return { type: 'trend', trend, usable: trend !== 'mixed', pass: trend === c.expect }
  }
  const side = c.side ?? 'above'
  const v = limitVerdict(node, c.v, c.to, side, c.expect, sit.vars, sit.sampling, seed)
  if (v.kind === 'unstable') return { type: 'limit', pass: false, usable: false, becomes: 'unknown' }
  if (v.kind === 'inf') return { type: 'limit', pass: c.expect === 'inf', usable: true, becomes: 'inf' }
  if (v.matches) return { type: 'limit', pass: true, usable: true, becomes: 'value', becomesTex: tex(c.expect) }
  const g = c.gives?.[src]
  if (g && g !== 'inf') return { type: 'limit', pass: false, usable: true, becomes: 'value', becomesTex: tex(g) }
  return { type: 'limit', pass: false, usable: true, becomes: 'unknown' }
}

function analyze(sit: Situation, src: string, isCorrect: boolean): ExprInfo {
  const node = parse(src)
  const d = dimOf(node, symDim)
  return {
    sit,
    src,
    node,
    tex: toTex(node, symTex),
    isCorrect,
    unitOk: d.ok && dimEq(d.dim, sit.target.dim),
    unitError: d.ok ? null : d.reason,
    unitText: d.ok ? formatDim(d.dim) : '',
    unitSteps: unitSteps(node, symUnit, symDim),
    checks: sit.checks.map((c, i) => analyzeCheck(sit, src, node, c, i)),
  }
}

export type SituationInfo = { sit: Situation; correct: ExprInfo; wrongs: ExprInfo[]; all: ExprInfo[] }

export const BANK: SituationInfo[] = SITUATIONS.map((sit) => {
  const correct = analyze(sit, sit.correct, true)
  const wrongs = sit.wrongs.map((w) => analyze(sit, w, false))
  return { sit, correct, wrongs, all: [correct, ...wrongs] }
})

/** その式が、単位かいずれかの検算で不合格になるか */
export function failsSomething(e: ExprInfo): boolean {
  return !e.unitOk || e.checks.some((c) => c.usable && !c.pass)
}

// ---------- 説明文 ----------

const targetLabel = (sit: Situation) => `${sit.target.name}〔${sit.target.unit}〕`

/** 検算の文（物理的に期待されること） */
export function checkText(c: Check): string {
  return c.type === 'limit' ? c.text : `${c.lead}、${c.words[c.expect]}はず`
}

/** 単位の検算の、短い理由（誤答時の1行） */
export function unitReason(e: ExprInfo): Part[] {
  if (e.unitError === 'add') return ['単位のちがうものは足せない（引けない）']
  if (e.unitError) return ['単位が決まらない式']
  return e.unitOk
    ? [`この式の単位は ${e.unitText}。${targetLabel(e.sit)}と合う`]
    : [`この式の単位は ${e.unitText}。${targetLabel(e.sit)}にならない`]
}

/** 単位の検算の、くわしい解説 */
export function unitExplain(e: ExprInfo): Part[] {
  return [`単位で検算：${e.unitSteps}　／　求めたい量は ${targetLabel(e.sit)}`]
}

const TREND_WORD: Record<Trend, string> = { up: '大きくなる', down: '小さくなる', flat: '変わらない', mixed: '場合による' }

/** 「〜になる」「〜に近づく」「いくらでも大きくなる」 */
function valueParts(value: string, verb: string): Part[] {
  return value === 'inf' ? ['いくらでも大きくなる'] : [{ tex: tex(value) }, ` ${verb}`]
}

/** ある式が、極限・増減の検算でどうなるか */
export function checkReason(e: ExprInfo, idx: number): Part[] {
  const c = e.sit.checks[idx]
  const r = e.checks[idx]
  if (c.type === 'trend' && r.type === 'trend') {
    const name = symDef(c.v).plain
    return [`${name} を大きくすると、この式の値は${TREND_WORD[r.trend]}`]
  }
  if (c.type === 'limit' && r.type === 'limit') {
    const head = `${c.when}、この式は `
    if (r.becomes === 'inf') return [head, 'いくらでも大きくなる']
    if (r.becomes === 'value' && r.becomesTex) return [head, { tex: r.becomesTex }, ` ${c.verb}`]
    return [head, '期待される値にならない']
  }
  return []
}

/** 誤答の式を、どの検算で落とせるか（最初に見つかった理由） */
export function firstFailure(e: ExprInfo): { label: string; reason: Part[] } | null {
  if (!e.unitOk) return { label: '単位', reason: unitReason(e) }
  const order = e.sit.checks
    .map((c, i) => ({ c, i }))
    .sort((a, b) => (a.c.type === b.c.type ? a.i - b.i : a.c.type === 'limit' ? -1 : 1))
  for (const { c, i } of order) {
    const r = e.checks[i]
    if (r.usable && !r.pass) {
      return { label: c.type === 'limit' ? '極限' : '増減', reason: [...checkReason(e, i), `（${checkText(c)}）`] }
    }
  }
  return null
}

/** 単位カード：式に出てくる文字とその単位 */
export function unitCard(e: ExprInfo): { tex: string; unit: string }[] {
  return [...symbolsOf(e.node)].map((name) => ({ tex: symTex(name), unit: symUnit(name) || '単位なし' }))
}

// ---------- 出題 ----------
// レベル1：式（誤った式も含む）の単位が、求めたい量と合うかを判定する。
// レベル2・3：正しい式だけを見せ、その極限・増減についての「説明」が正しいかを判定する。
//   説明の正誤は、正しい式の数値計算から決める（データには正誤を書かない）。

export type Level = 1 | 2 | 3

export type Question = {
  /** 記録用のID */
  id: string
  level: Level
  /** 表示する式（レベル2・3では必ず正しい式） */
  expr: ExprInfo
  /** レベル2・3で使う検算の番号 */
  checkIndex: number | null
  /** レベル2・3で判定させる説明 */
  statement: Part[] | null
  /** レベル1：単位が合う／レベル2・3：説明はその通り */
  answer: boolean
}

type PoolItem = Omit<Question, 'level'>

/** 説明に使う値が、正しい式の極限と一致するか */
function limitIs(s: SituationInfo, idx: number, value: string): boolean | null {
  const c = s.sit.checks[idx]
  if (c.type !== 'limit') return null
  const v = limitVerdict(s.correct.node, c.v, c.to, c.side ?? 'above', value, s.sit.vars, s.sit.sampling, seedOf(`${s.sit.id}|stmt|${idx}|${value}`))
  if (v.kind === 'unstable') return null
  if (value === 'inf') return v.kind === 'inf'
  return v.kind === 'finite' && v.matches
}

/** レベル2・3の説明の候補（状況ごと・検算ごと） */
export function statementsOf(s: SituationInfo, idx: number): { key: string; parts: Part[]; truth: boolean }[] {
  const c = s.sit.checks[idx]
  const r = s.correct.checks[idx]
  // 正しい式が期待どおりにふるまう検算だけを使う
  if (!r.usable || !r.pass) return []
  const name = s.sit.target.name
  if (c.type === 'limit') {
    const out: { key: string; parts: Part[]; truth: boolean }[] = []
    for (const value of [c.expect, ...c.alts]) {
      const truth = limitIs(s, idx, value)
      if (truth === null) continue
      out.push({ key: value, truth, parts: [`${c.when}、${name}は `, ...valueParts(value, c.verb)] })
    }
    return out
  }
  if (r.type !== 'trend') return []
  return (['up', 'down', 'flat'] as const).map((k) => ({
    key: k,
    truth: k === r.trend,
    parts: [`${c.lead}、${c.words[k]}`],
  }))
}

function buildPool(level: Level): PoolItem[] {
  const items: PoolItem[] = []
  for (const s of BANK) {
    if (level === 1) {
      for (const e of s.all) {
        items.push({ id: `${s.sit.id}|${e.src}|u`, expr: e, checkIndex: null, statement: null, answer: e.unitOk })
      }
      continue
    }
    s.sit.checks.forEach((c, i) => {
      if ((level === 2 && c.type !== 'limit') || (level === 3 && c.type !== 'trend')) return
      for (const st of statementsOf(s, i)) {
        items.push({ id: `${s.sit.id}|${i}|${st.key}`, expr: s.correct, checkIndex: i, statement: st.parts, answer: st.truth })
      }
    })
  }
  return items
}

const POOLS: Record<Level, PoolItem[]> = { 1: buildPool(1), 2: buildPool(2), 3: buildPool(3) }

export function poolFor(level: Level, units: UnitGroup[]): PoolItem[] {
  return POOLS[level].filter((p) => units.includes(p.expr.sit.unit))
}

const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]

/**
 * 1問つくる。○と×がおよそ半々になり、同じ状況が続かないようにする。
 * prevSitId: 直前の問題の状況ID / recent: 最近出した問題のID（同じ問題のくり返しを避ける）
 */
export function nextQuestion(
  level: Level,
  units: UnitGroup[],
  prevSitId: string | null,
  rng: () => number = Math.random,
  recent: string[] = [],
): Question {
  const pool = poolFor(level, units)
  if (pool.length === 0) throw new Error('出題できる問題がありません')
  const want = rng() < 0.5
  let cand = pool.filter((p) => p.answer === want)
  if (cand.length === 0) cand = pool
  const otherSit = cand.filter((p) => p.expr.sit.id !== prevSitId)
  const unseen = otherSit.filter((p) => !recent.includes(p.id))
  const it = pick(unseen.length ? unseen : otherSit.length ? otherSit : cand, rng)
  return { ...it, level }
}

/** 問題の理由（誤答時の1行）。レベル2・3では、正しい式が実際にどうなるかを示す */
export function questionReason(q: Question): Part[] {
  return q.checkIndex === null ? unitReason(q.expr) : checkReason(q.expr, q.checkIndex)
}

/** 問題のくわしい解説（結果画面用） */
export function questionExplain(q: Question): Part[] {
  if (q.checkIndex === null) return unitExplain(q.expr)
  const c = q.expr.sit.checks[q.checkIndex]
  const why = c.type === 'limit' ? [`（${c.text}）`] : []
  return [...checkReason(q.expr, q.checkIndex), ...why]
}

// ---------- レベル4（計算せずに選べ） ----------

export type Question4 = { sit: SituationInfo; options: ExprInfo[]; correctIndex: number }

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 誤答3つがすべて検算で落とせる状況だけを使う */
export function level4Situations(units: UnitGroup[]): SituationInfo[] {
  return BANK.filter((s) => units.includes(s.sit.unit) && s.wrongs.filter(failsSomething).length >= 3)
}

export function nextQuestion4(units: UnitGroup[], used: string[], rng: () => number = Math.random): Question4 {
  const all = level4Situations(units)
  if (all.length === 0) throw new Error('出題できる問題がありません')
  const fresh = all.filter((s) => !used.includes(s.sit.id))
  const sit = pick(fresh.length ? fresh : all, rng)
  const wrongs = shuffle(sit.wrongs.filter(failsSomething), rng).slice(0, 3)
  const options = shuffle([sit.correct, ...wrongs], rng)
  return { sit, options, correctIndex: options.indexOf(sit.correct) }
}

/** 検算ボタン：選んだ検算での、各式の結果 */
export function checkTable(q: Question4, which: 'unit' | number): { ok: boolean; parts: Part[] }[] {
  return q.options.map((e) => {
    if (which === 'unit') {
      return { ok: e.unitOk, parts: e.unitError === 'add' ? ['足せない'] : [e.unitText || '決まらない'] }
    }
    const c = e.sit.checks[which]
    const r = e.checks[which]
    if (c.type === 'trend' && r.type === 'trend') return { ok: r.pass, parts: [TREND_WORD[r.trend]] }
    if (r.type === 'limit') {
      if (r.becomes === 'inf') return { ok: r.pass, parts: ['いくらでも大きくなる'] }
      if (r.becomesTex) return { ok: r.pass, parts: [{ tex: r.becomesTex }] }
    }
    return { ok: r.pass, parts: [r.pass ? '合う' : '合わない'] }
  })
}
