import { questionExplain, type Question } from '../core/bank'
import { bestTime, formatTime, type Attempt } from '../core/storage'
import { Rich } from './Tex'
import { HistoryChart } from './HistoryChart'
import { Formula, GhostButton, Kbd, LEVEL_NAME, PrimaryButton, choiceLabels, useKeys } from './common'
import { GOAL } from './TimeAttack'

type Props = {
  attempt: Attempt
  /** この回より前の記録 */
  before: Attempt[]
  /** この回を含む全記録 */
  all: Attempt[]
  wrongs: Question[]
  onRetry: () => void
  onHome: () => void
}

export function Result({ attempt, before, all, wrongs, onRetry, onHome }: Props) {
  const prevBest = bestTime(before, attempt.level)
  const isBest = prevBest === null || attempt.timeMs < prevBest
  const diff = prevBest === null ? null : (attempt.timeMs - prevBest) / 1000
  const rate = Math.round((GOAL / (GOAL + attempt.wrong)) * 100)
  const { yes, no } = choiceLabels(attempt.level)

  // キーボード：Enter か Space でもう一度、Esc でレベル選択へ
  useKeys((key) => {
    if (key === 'Enter' || key === ' ') {
      onRetry()
      return true
    }
    if (key === 'Escape') {
      onHome()
      return true
    }
  })

  return (
    <div className="mx-auto max-w-xl px-4 py-6 flex flex-col gap-5">
      <p className="text-center text-sm font-bold text-slate-500">
        レベル{attempt.level} {LEVEL_NAME[attempt.level]}
      </p>
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm border border-slate-200">
        <p className="text-sm text-slate-500">タイム</p>
        <p className="font-mono text-5xl font-bold tabular-nums text-slate-900">
          {formatTime(attempt.timeMs)}
          <span className="ml-1 text-xl">秒</span>
        </p>
        <p className="mt-2 text-sm font-bold">
          {isBest ? (
            <span className="text-acc">{prevBest === null ? 'はじめての記録' : `自己ベスト更新（${diff!.toFixed(1)} 秒）`}</span>
          ) : (
            <span className="text-slate-500">自己ベストまで あと {diff!.toFixed(1)} 秒</span>
          )}
        </p>
        <p className="mt-3 text-slate-700">
          正答率 <span className="text-xl font-bold">{rate}%</span>
          <span className="ml-2 text-sm text-slate-500">（まちがい {attempt.wrong} 問）</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton onClick={onRetry}>
          もう一度 <Kbd light>Enter</Kbd>
        </PrimaryButton>
        <GhostButton onClick={onHome}>
          レベルを変える <Kbd>Esc</Kbd>
        </GhostButton>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <h2 className="mb-2 text-sm font-bold text-slate-700">直近20回のタイム</h2>
        <HistoryChart attempts={all.filter((a) => a.level === attempt.level)} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">まちがえた問題</h2>
        {wrongs.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-slate-600 shadow-sm border border-slate-200">全問正解でした。</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {wrongs.map((q, i) => (
              <li key={i} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <p className="text-xs leading-relaxed text-slate-500">{q.expr.sit.title}</p>
                <div className="my-2 overflow-x-auto">
                  <Formula e={q.expr} small />
                </div>
                {q.statement && (
                  <p className="mb-1 text-sm leading-relaxed text-slate-800">
                    <span className="mr-1 text-xs font-bold text-slate-500">説明</span>
                    <Rich parts={q.statement} />
                  </p>
                )}
                <p className="text-sm font-bold text-vel">正しい判定：{q.answer ? `○ ${yes}` : `✕ ${no}`}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  <Rich parts={questionExplain(q)} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
