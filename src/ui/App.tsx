import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Question } from '../core/bank'
import type { UnitGroup } from '../data/situations'
import { clearAttempts, loadAttempts, saveAttempt, type Attempt } from '../core/storage'
import { Home } from './Home'
import { TimeAttack, GOAL, type AttackResult } from './TimeAttack'
import { Result } from './Result'
import { Slow4, type SlowResult } from './Slow4'
import { Slow5 } from './Slow5'
import { GhostButton, LEVEL_NAME, PrimaryButton } from './common'

type Lv = 1 | 2 | 3 | 4 | 5

type Screen =
  | { name: 'home' }
  | { name: 'play'; level: Lv; key: number }
  | { name: 'result'; attempt: Attempt; before: Attempt[]; wrongs: Question[] }
  | { name: 'slowResult'; level: 4 | 5; r: SlowResult }

const GROUPS: UnitGroup[] = ['basic', 'mech', 'other']

/** URLパラメータ：?lv=1..5 &unit=basic,mech,other &card=0 &big=1 */
function readParams() {
  const p = new URLSearchParams(window.location.search)
  const lvNum = Number(p.get('lv'))
  const lv = [1, 2, 3, 4, 5].includes(lvNum) ? (lvNum as Lv) : null
  const units = (p.get('unit') ?? '')
    .split(',')
    .filter((u): u is UnitGroup => (GROUPS as string[]).includes(u))
  return {
    lv,
    units: units.length ? GROUPS.filter((g) => units.includes(g)) : (['basic'] as UnitGroup[]),
    card: p.get('card') !== '0',
    big: p.get('big') === '1',
  }
}

export default function App() {
  const init = useMemo(readParams, [])
  const [units, setUnits] = useState<UnitGroup[]>(init.units)
  const [card, setCard] = useState(init.card)
  const [attempts, setAttempts] = useState<Attempt[]>(() => loadAttempts())
  const [screen, setScreen] = useState<Screen>(init.lv ? { name: 'play', level: init.lv, key: 0 } : { name: 'home' })

  useEffect(() => {
    document.documentElement.classList.toggle('big', init.big)
  }, [init.big])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const home = useCallback(() => setScreen({ name: 'home' }), [])
  const start = useCallback((level: Lv) => setScreen({ name: 'play', level, key: Date.now() }), [])

  const finishAttack = useCallback(
    (level: 1 | 2 | 3, r: AttackResult) => {
      const attempt: Attempt = {
        at: new Date().toISOString(),
        level,
        units,
        timeMs: Math.round(r.timeMs),
        correct: GOAL,
        wrong: r.wrongs.length,
        wrongIds: r.wrongs.map((q) => q.id),
        extra: level === 1 ? { card } : undefined,
      }
      const before = attempts
      setAttempts(saveAttempt(attempt))
      setScreen({ name: 'result', attempt, before, wrongs: r.wrongs })
    },
    [units, card, attempts],
  )

  const finishSlow = useCallback(
    (level: 4 | 5, r: SlowResult) => {
      setAttempts(
        saveAttempt({
          at: new Date().toISOString(),
          level,
          units,
          timeMs: 0,
          correct: r.correct,
          wrong: r.total - r.correct,
          wrongIds: r.wrongIds,
          extra: r.checksUsed === undefined ? undefined : { checksUsed: r.checksUsed },
        }),
      )
      setScreen({ name: 'slowResult', level, r })
    },
    [units],
  )

  if (screen.name === 'play') {
    const { level, key } = screen
    if (level === 4) return <Slow4 key={key} units={units} onFinish={(r) => finishSlow(4, r)} onQuit={home} />
    if (level === 5) return <Slow5 key={key} onFinish={(r) => finishSlow(5, r)} onQuit={home} />
    return <TimeAttack key={key} level={level} units={units} card={card} onFinish={(r) => finishAttack(level, r)} onQuit={home} />
  }

  if (screen.name === 'result') {
    return (
      <Result
        attempt={screen.attempt}
        before={screen.before}
        all={attempts}
        wrongs={screen.wrongs}
        onRetry={() => start(screen.attempt.level)}
        onHome={home}
      />
    )
  }

  if (screen.name === 'slowResult') {
    const { level, r } = screen
    return (
      <div className="mx-auto max-w-xl px-4 py-10 flex flex-col gap-5 text-center">
        <p className="text-sm font-bold text-slate-500">
          レベル{level} {LEVEL_NAME[level]}
        </p>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">正解</p>
          <p className="text-5xl font-bold text-slate-900">
            {r.correct}
            <span className="ml-1 text-xl">/ {r.total} 問</span>
          </p>
          {r.checksUsed !== undefined && <p className="mt-3 text-sm text-slate-600">検算ボタンを使った回数：{r.checksUsed} 回</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PrimaryButton onClick={() => start(level)}>もう一度</PrimaryButton>
          <GhostButton onClick={home}>レベルを変える</GhostButton>
        </div>
      </div>
    )
  }

  return (
    <Home
      units={units}
      setUnits={setUnits}
      card={card}
      setCard={setCard}
      attempts={attempts}
      onStart={start}
      onClear={() => {
        clearAttempts()
        setAttempts([])
      }}
    />
  )
}
