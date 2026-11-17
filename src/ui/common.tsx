import type { ReactNode } from 'react'
import type { ExprInfo } from '../core/bank'
import { Tex } from './Tex'

/** 2択ボタンの文言。レベル1は単位、レベル2・3は説明の正誤 */
export function choiceLabels(level: number): { yes: string; no: string } {
  return level === 1 ? { yes: '単位が合う', no: '合わない' } : { yes: 'その通り', no: '誤っている' }
}

export const LEVEL_NAME: Record<number, string> = {
  1: '単位チェック',
  2: '極限チェック',
  3: '増減チェック',
  4: '計算せずに選べ',
  5: 'まちがい探し',
}

/** 「求めたい量 = 式」の表示 */
export function Formula({ e, small }: { e: ExprInfo; small?: boolean }) {
  return <Tex className={small ? 'formula-sm' : 'formula'} tex={`${e.sit.target.tex} = ${e.tex}`} />
}

export function TopBar({ left, center, right }: { left: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-200">
      <div className="min-w-16">{left}</div>
      <div className="flex-1 text-center text-sm font-bold text-slate-700">{center}</div>
      <div className="min-w-16 text-right">{right}</div>
    </div>
  )
}

export function QuitButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="min-h-11 px-3 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
      ← やめる
    </button>
  )
}

export function PrimaryButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 px-5 rounded-xl bg-pos text-white font-bold shadow-sm active:translate-y-px disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="min-h-12 px-5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold active:translate-y-px">
      {children}
    </button>
  )
}
