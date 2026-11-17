import { useEffect, useRef, type ReactNode } from 'react'
import type { ExprInfo } from '../core/bank'
import { Tex } from './Tex'

/**
 * キーボード操作。handler が true を返したキーは、ブラウザの既定の動作を止める。
 * - Ctrl などとの同時押し、押しっぱなしのくり返しは無視する
 * - ボタンなどにフォーカスがあるときの Enter・Space は、そのボタンの操作にまかせる
 * 1文字のキーは小文字にして渡す（例: 'f'）。それ以外は 'Enter' 'Escape' 'ArrowLeft' など。
 */
export function useKeys(handler: (key: string) => boolean | void) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || ev.isComposing) return
      const t = ev.target as HTMLElement | null
      const onControl = !!t && /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)
      if (onControl && (ev.key === 'Enter' || ev.key === ' ')) return
      const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key
      if (ref.current(key)) ev.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** 押したボタンにフォーカスが残って、次のキー入力を横取りしないようにする */
export function blurActive() {
  const el = document.activeElement
  if (el instanceof HTMLElement) el.blur()
}

/** キーの案内。マウスのある端末（PC）でだけ表示する */
export function Kbd({ children, light }: { children: ReactNode; light?: boolean }) {
  return <kbd className={`kbd ${light ? 'kbd-light' : ''}`}>{children}</kbd>
}

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
      ← やめる <Kbd>Esc</Kbd>
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
