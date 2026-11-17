import { UNIT_GROUP_LABEL, type UnitGroup } from '../data/situations'
import { bestTime, formatTime, type Attempt } from '../core/storage'
import { LEVEL_NAME } from './common'

type Props = {
  units: UnitGroup[]
  setUnits: (u: UnitGroup[]) => void
  card: boolean
  setCard: (c: boolean) => void
  attempts: Attempt[]
  onStart: (level: 1 | 2 | 3 | 4 | 5) => void
  onClear: () => void
}

const GROUPS: UnitGroup[] = ['basic', 'mech', 'other']

const ATTACK: { level: 1 | 2 | 3; desc: string }[] = [
  { level: 1, desc: '式の単位が、求めたい量の単位と合うかを見る' },
  { level: 2, desc: '極端な場合・特別な場合に、当然の結果になるかを見る' },
  { level: 3, desc: '条件を変えたときの増え方・減り方が自然かを見る' },
]
const SLOW: { level: 4 | 5; desc: string }[] = [
  { level: 4, desc: '4つの式から、検算だけで正しい式を選ぶ' },
  { level: 5, desc: '答案の中から、誤りのある行を見つける' },
]

export function Home({ units, setUnits, card, setCard, attempts, onStart, onClear }: Props) {
  const toggle = (g: UnitGroup) => {
    const next = units.includes(g) ? units.filter((u) => u !== g) : [...units, g]
    if (next.length) setUnits(GROUPS.filter((x) => next.includes(x)))
  }
  const count = (level: number) => attempts.filter((a) => a.level === level).length

  return (
    <div className="mx-auto max-w-xl px-4 py-6 flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">答えの吟味タイムアタック</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          その式、合ってる？ 解き直さずに<b>単位・極限・増減</b>で見抜こう
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">出題する単元</h2>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => {
            const on = units.includes(g)
            return (
              <button
                key={g}
                onClick={() => toggle(g)}
                aria-pressed={on}
                className={`min-h-11 rounded-full border-2 px-4 text-sm font-bold ${on ? 'bg-pos text-white border-pos' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                {on ? '✓ ' : ''}
                {UNIT_GROUP_LABEL[g]}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">タイムアタック（12問正解でゴール）</h2>
        <div className="flex flex-col gap-3">
          {ATTACK.map(({ level, desc }) => {
            const best = bestTime(attempts, level)
            return (
              <div key={level} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-white">レベル{level}</span>
                      {LEVEL_NAME[level]}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {best === null ? '記録なし' : `自己ベスト ${formatTime(best)} 秒・${count(level)} 回`}
                    </p>
                  </div>
                  <button
                    onClick={() => onStart(level)}
                    className="min-h-14 shrink-0 rounded-xl bg-pos px-5 font-bold text-white shadow-sm active:translate-y-px"
                  >
                    スタート
                  </button>
                </div>
                {level === 1 && (
                  <label className="mt-3 flex min-h-11 items-center gap-2 border-t border-slate-100 pt-2 text-sm text-slate-700">
                    <input type="checkbox" className="h-5 w-5" checked={card} onChange={(e) => setCard(e.target.checked)} />
                    単位カード（文字ごとの単位）を表示する
                  </label>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">じっくりモード（時間制限なし）</h2>
        <div className="flex flex-col gap-3">
          {SLOW.map(({ level, desc }) => (
            <div key={level} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <div className="flex-1">
                <p className="font-bold text-slate-900">
                  <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-white">レベル{level}</span>
                  {LEVEL_NAME[level]}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
              <button
                onClick={() => onStart(level)}
                className="min-h-14 shrink-0 rounded-xl bg-white border-2 border-pos px-5 font-bold text-pos active:translate-y-px"
              >
                はじめる
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs leading-relaxed text-slate-500">
        <p>検算は「誤りを見つける道具」です。合格した式が必ず正しいとは限りません。</p>
        <p className="mt-1">記録はこの端末の中だけに保存されます。</p>
        {attempts.length > 0 && (
          <button onClick={onClear} className="mt-2 min-h-11 px-3 underline">
            記録を消す
          </button>
        )}
      </footer>
    </div>
  )
}
