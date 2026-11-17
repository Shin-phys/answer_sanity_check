import { useMemo, useState, type ReactNode } from 'react'
import { checkTable, firstFailure, level4Situations, nextQuestion4, type Question4 } from '../core/bank'
import type { UnitGroup } from '../data/situations'
import { symDef } from '../data/symbols'
import { Figure } from './Figure'
import { Rich, Tex } from './Tex'
import { PrimaryButton, QuitButton, TopBar } from './common'

const MARK = ['①', '②', '③', '④']

export type SlowResult = { correct: number; total: number; wrongIds: string[]; checksUsed?: number }

type Props = { units: UnitGroup[]; onFinish: (r: SlowResult) => void; onQuit: () => void }

/** レベル4：4つの式から、計算せずに正しい式を選ぶ */
export function Slow4({ units, onFinish, onQuit }: Props) {
  const total = Math.min(5, level4Situations(units).length)
  const [used, setUsed] = useState<string[]>([])
  const [q, setQ] = useState<Question4>(() => nextQuestion4(units, []))
  const [n, setN] = useState(1)
  const [chosen, setChosen] = useState<number | null>(null)
  const [which, setWhich] = useState<'unit' | number | null>(null)
  const [checksUsed, setChecksUsed] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])

  const sit = q.sit.sit
  const table = useMemo(() => (which === null ? null : checkTable(q, which)), [q, which])
  const answered = chosen !== null

  const choose = (i: number) => {
    if (answered) return
    setChosen(i)
    if (i === q.correctIndex) setCorrect((c) => c + 1)
    else setWrongIds((w) => [...w, sit.id])
  }
  const openCheck = (w: 'unit' | number) => {
    if (which !== w && !answered) setChecksUsed((c) => c + 1)
    setWhich(w)
  }
  const next = () => {
    if (n >= total) {
      onFinish({ correct, total, wrongIds, checksUsed })
      return
    }
    const u = [...used, sit.id]
    setUsed(u)
    setQ(nextQuestion4(units, u))
    setN(n + 1)
    setChosen(null)
    setWhich(null)
  }

  const checkLabel = (i: number) => {
    const c = sit.checks[i]
    return c.type === 'limit' ? c.cond : `${symDef(c.v).plain} を大きく`
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar left={<QuitButton onClick={onQuit} />} center="レベル4 計算せずに選べ" right={<span className="text-sm text-slate-600">{n} / {total}</span>} />
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Figure name={sit.figure} className="h-24 w-auto" />
          <p className="leading-relaxed text-slate-700">{sit.title}</p>
          <p className="text-sm font-bold text-slate-800">
            正しい式はどれ？（<Tex tex={sit.target.tex} /> ＝ ）
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {q.options.map((e, i) => {
            const isRight = i === q.correctIndex
            const state = !answered ? 'idle' : isRight ? 'right' : i === chosen ? 'wrong' : 'other'
            const cls = {
              idle: 'bg-white border-slate-300 active:bg-slate-50',
              right: 'bg-acc/10 border-acc',
              wrong: 'bg-vel/10 border-vel',
              other: 'bg-white border-slate-200 opacity-80',
            }[state]
            return (
              <button
                key={e.src}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left ${cls}`}
              >
                <span className="text-xl font-bold text-slate-500">{MARK[i]}</span>
                <span className="flex-1 overflow-x-auto py-1 text-center">
                  <Tex className="formula-sm" tex={e.tex} />
                </span>
                {table && (
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-sm font-bold ${table[i].ok ? 'bg-acc/15 text-acc' : 'bg-vel/15 text-vel'}`}>
                    <Rich parts={table[i].parts} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <section className="rounded-2xl bg-white p-3 shadow-sm border border-slate-200">
          <h2 className="mb-2 text-sm font-bold text-slate-700">検算してみる</h2>
          <div className="flex flex-wrap gap-2">
            <CheckChip active={which === 'unit'} onClick={() => openCheck('unit')}>
              単位
            </CheckChip>
            {sit.checks.map((_, i) => (
              <CheckChip key={i} active={which === i} onClick={() => openCheck(i)}>
                {checkLabel(i)}
              </CheckChip>
            ))}
          </div>
          {which !== null && (
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {which === 'unit'
                ? `求めたい量は ${sit.target.name}〔${sit.target.unit}〕。それぞれの式の単位を、式の右に表示しています。`
                : `${sit.checks[which].text}。それぞれの式がどうなるかを、式の右に表示しています。`}
            </p>
          )}
        </section>

        {answered && (
          <section className="pop rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <p className={`text-lg font-bold ${chosen === q.correctIndex ? 'text-acc' : 'text-vel'}`}>
              {chosen === q.correctIndex ? '○ 正解' : `✕ 正解は ${MARK[q.correctIndex]}`}
            </p>
            <ul className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-slate-700">
              {q.options.map((e, i) => {
                if (e.isCorrect) return null
                const f = firstFailure(e)
                return (
                  <li key={e.src}>
                    <span className="font-bold">
                      {MARK[i]} は【{f?.label}】で落とせる：
                    </span>
                    {f && <Rich parts={f.reason} />}
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 text-right">
              <PrimaryButton onClick={next}>{n >= total ? '結果を見る' : '次の問題へ'}</PrimaryButton>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function CheckChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm font-bold ${active ? 'bg-pos text-white border-pos' : 'bg-white text-slate-700 border-slate-300'}`}
    >
      {children}
    </button>
  )
}
