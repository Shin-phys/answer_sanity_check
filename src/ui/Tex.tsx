import { memo } from 'react'
import katex from 'katex'
import type { Part } from '../core/bank'

const cache = new Map<string, string>()
function render(tex: string): string {
  let html = cache.get(tex)
  if (html === undefined) {
    html = katex.renderToString(tex, { throwOnError: false, output: 'html' })
    cache.set(tex, html)
  }
  return html
}

/** 数式（KaTeX） */
export const Tex = memo(function Tex({ tex, className }: { tex: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: render(tex) }} />
})

/** 文章と数式がまざった表示 */
export function Rich({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : <Tex key={i} tex={p.tex} />))}
    </>
  )
}
