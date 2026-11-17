import { useCallback, useEffect, useRef, useState } from 'react'
import { nextQuestion, questionReason, unitCard, type Level, type Question } from '../core/bank'
import type { UnitGroup } from '../data/situations'
import { formatTime } from '../core/storage'
import { Figure } from './Figure'
import { Rich, Tex } from './Tex'
import { Formula, LEVEL_NAME, QuitButton, TopBar, choiceLabels } from './common'

export const GOAL = 12
const LOCK_MS = 1500
const OK_MS = 280
/** 直近この数の問題は、できるだけくり返さない */
const RECENT = 6

export type AttackResult = { timeMs: number; wrongs: Question[] }

type Props = {
  level: Level
  units: UnitGroup[]
  card: boolean
  onFinish: (r: AttackResult) => void
  onQuit: () => void
}

export function TimeAttack({ level, units, card, onFinish, onQuit }: Props) {
  const [q, setQ] = useState<Question>(() => nextQuestion(level, units, null))
  const [correct, setCorrect] = useState(0)
  const [phase, setPhase] = useState<'play' | 'ok' | 'ng'>('play')
  const [elapsed, setElapsed] = useState(0)
  const start = useRef(performance.now())
  const wrongs = useRef<Question[]>([])
  const timer = useRef<number | undefined>(undefined)
  const done = useRef(false)
  const recent = useRef<string[]>([q.id])

  const advance = useCallback(
    (prev: Question) => {
      const nq = nextQuestion(level, units, prev.expr.sit.id, Math.random, recent.current)
      recent.current = [...recent.current, nq.id].slice(-RECENT)
      setQ(nq)
      setPhase('play')
    },
    [level, units],
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!done.current) setElapsed(performance.now() - start.current)
    }, 100)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(timer.current)
    }
  }, [])

  const answer = useCallback(
    (choice: boolean) => {
      if (phase !== 'play' || done.current) return
      if (choice === q.answer) {
        const n = correct + 1
        setCorrect(n)
        if (n >= GOAL) {
          done.current = true
          const timeMs = performance.now() - start.current
          setElapsed(timeMs)
          setPhase('ok')
          timer.current = window.setTimeout(() => onFinish({ timeMs, wrongs: wrongs.current }), 350)
          return
        }
        setPhase('ok')
        timer.current = window.setTimeout(() => advance(q), OK_MS)
      } else {
        wrongs.current = [...wrongs.current, q]
        setPhase('ng')
        timer.current = window.setTimeout(() => advance(q), LOCK_MS)
      }
    },
    [phase, q, correct, advance, onFinish],
  )

  // PC・投影用：← → キーでも答えられる
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft') answer(true)
      if (ev.key === 'ArrowRight') answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const sit = q.expr.sit
  const { yes, no } = choiceLabels(level)
  const locked = phase !== 'play'

  return (
    <div className="h-dvh flex flex-col">
      <TopBar
        left={<QuitButton onClick={onQuit} />}
        center={
          <span>
            レベル{level} {LEVEL_NAME[level]}
          </span>
        }
        right={<span className="font-mono text-lg tabular-nums text-slate-800">{formatTime(elapsed)}</span>}
      />
      <div className="flex justify-center gap-1.5 py-2 bg-white" aria-label={`正解 ${correct} / ${GOAL}`}>
        {Array.from({ length: GOAL }, (_, i) => (
          <span key={i} className={`h-2.5 w-5 rounded-full ${i < correct ? 'bg-acc' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto max-w-xl flex flex-col items-center gap-3 text-center">
          {level !== 1 && <Figure name={sit.figure} className="h-24 w-auto" />}
          <p className="text-sm leading-relaxed text-slate-600">{sit.title}</p>
          {level === 1 && (
            <p className="text-base font-bold text-slate-800">
              求めたい量：{sit.target.name} <Tex tex={sit.target.tex} />〔{sit.target.unit}〕
            </p>
          )}
          <div className="w-full overflow-x-auto rounded-2xl bg-white px-3 pb-5 pt-2 shadow-sm border border-slate-200">
            <p className="mb-2 text-left text-xs font-bold text-slate-500">
              {level === 1 ? 'ある人が出した答え（正しいとは限らない）' : '正しい式'}
            </p>
            <Formula e={q.expr} />
          </div>
          {level === 1 && card && (
            <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-700">
              {unitCard(q.expr).map((u) => (
                <span key={u.tex} className="rounded-lg bg-slate-200/70 px-2 py-1">
                  <Tex tex={u.tex} />〔{u.unit}〕
                </span>
              ))}
            </div>
          )}
          {q.statement && (
            <div className="w-full rounded-xl border-2 border-pos/40 bg-pos/5 px-3 py-2.5 text-left">
              <p className="mb-1 text-xs font-bold text-pos">この式について、次の説明は正しい？</p>
              <p className="text-lg font-bold leading-relaxed text-slate-900">
                <Rich parts={q.statement} />
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-white border-t border-slate-200 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {phase === 'ng' && (
          <div className="pop absolute inset-x-3 bottom-full mb-2 rounded-xl bg-vel px-3 py-2.5 text-white shadow-lg" role="alert">
            <p className="font-bold">正しくは「{q.answer ? `○ ${yes}` : `✕ ${no}`}」</p>
            <p className="text-sm leading-relaxed">
              <Rich parts={questionReason(q)} />
            </p>
          </div>
        )}
        {phase === 'ok' && (
          <div className="pop absolute left-1/2 bottom-full mb-2 -translate-x-1/2 rounded-full bg-acc px-5 py-1.5 text-lg font-bold text-white shadow-lg">
            ○ 正解
          </div>
        )}
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
          <button
            onClick={() => answer(true)}
            disabled={locked}
            className="min-h-20 rounded-2xl bg-pos text-xl font-bold text-white shadow active:translate-y-px disabled:opacity-40"
          >
            ○ {yes}
          </button>
          <button
            onClick={() => answer(false)}
            disabled={locked}
            className="min-h-20 rounded-2xl bg-slate-700 text-xl font-bold text-white shadow active:translate-y-px disabled:opacity-40"
          >
            ✕ {no}
          </button>
        </div>
      </div>
    </div>
  )
}
