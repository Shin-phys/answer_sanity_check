import { useState } from 'react'
import { KIND_LABEL, KIND_ORDER, MISTAKES, type Mistake, type MistakeKind } from '../data/mistakes'
import { Figure } from './Figure'
import { Rich } from './Tex'
import { PrimaryButton, QuitButton, TopBar } from './common'
import type { SlowResult } from './Slow4'

const NUM = ['①', '②', '③', '④', '⑤']

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** レベル5：答案の中から誤りのある行を見つけ、誤りの種類を選ぶ */
export function Slow5({ onFinish, onQuit }: { onFinish: (r: SlowResult) => void; onQuit: () => void }) {
  const [order] = useState<Mistake[]>(() => shuffled(MISTAKES))
  const [idx, setIdx] = useState(0)
  const [line, setLine] = useState<number | null>(null)
  const [kind, setKind] = useState<MistakeKind | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])

  const m = order[idx]
  const total = order.length
  const lineRight = line === m.wrongLine
  const kindRight = kind === m.kind

  const pickKind = (k: MistakeKind) => {
    if (kind !== null) return
    setKind(k)
    if (lineRight && k === m.kind) setCorrect((c) => c + 1)
    else setWrongIds((w) => [...w, m.id])
  }
  const next = () => {
    if (idx + 1 >= total) {
      onFinish({ correct, total, wrongIds })
      return
    }
    setIdx(idx + 1)
    setLine(null)
    setKind(null)
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar left={<QuitButton onClick={onQuit} />} center="レベル5 まちがい探し" right={<span className="text-sm text-slate-600">{idx + 1} / {total}</span>} />
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Figure name={m.figure} className="h-24 w-auto" />
          <p className="leading-relaxed text-slate-700">{m.title}</p>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-800">
            {line === null ? '① この答案には誤りが1行あります。その行をタップ' : '答案'}
          </h2>
          <ol className="flex flex-col gap-2">
            {m.lines.map((parts, i) => {
              const picked = line === i
              const reveal = line !== null && i === m.wrongLine
              const cls = reveal
                ? 'border-vel bg-vel/10'
                : picked
                  ? 'border-slate-500 bg-slate-100'
                  : 'border-slate-300 bg-white'
              return (
                <li key={i}>
                  <button
                    onClick={() => line === null && setLine(i)}
                    disabled={line !== null}
                    className={`flex w-full min-h-14 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left ${cls}`}
                  >
                    <span className="font-bold text-slate-500">{NUM[i]}</span>
                    <span className="flex-1 overflow-x-auto leading-loose">
                      <Rich parts={parts} />
                    </span>
                    {reveal && <span className="shrink-0 text-sm font-bold text-vel">ここが誤り</span>}
                  </button>
                </li>
              )
            })}
          </ol>
          {line !== null && (
            <p className={`mt-2 font-bold ${lineRight ? 'text-acc' : 'text-vel'}`}>
              {lineRight ? '○ 行は正解' : `✕ 誤りがあるのは ${NUM[m.wrongLine]} の行`}
            </p>
          )}
        </section>

        {line !== null && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-800">② どんな種類の誤り？</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KIND_ORDER.map((k) => {
                const reveal = kind !== null && k === m.kind
                const picked = kind === k
                const cls = reveal ? 'border-acc bg-acc/10' : picked ? 'border-vel bg-vel/10' : 'border-slate-300 bg-white'
                return (
                  <button
                    key={k}
                    onClick={() => pickKind(k)}
                    disabled={kind !== null}
                    className={`min-h-12 rounded-xl border-2 px-3 text-left font-bold text-slate-700 ${cls}`}
                  >
                    {KIND_LABEL[k]}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {kind !== null && (
          <section className="pop rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <p className={`text-lg font-bold ${lineRight && kindRight ? 'text-acc' : 'text-vel'}`}>
              {lineRight && kindRight ? '○ 正解' : `誤りの種類は「${KIND_LABEL[m.kind]}」`}
            </p>
            <p className="mt-2 leading-loose text-slate-800">
              <span className="mr-1 text-sm font-bold text-slate-500">正しくは</span>
              <Rich parts={m.fix} />
            </p>
            <p className="mt-2 rounded-xl bg-pos/5 border border-pos/30 px-3 py-2 text-sm leading-relaxed text-slate-700">
              <span className="mr-2 rounded bg-pos px-1.5 py-0.5 text-xs font-bold text-white">検算</span>
              {m.hint}
            </p>
            <div className="mt-3 text-right">
              <PrimaryButton onClick={next}>{idx + 1 >= total ? '結果を見る' : '次の問題へ'}</PrimaryButton>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
