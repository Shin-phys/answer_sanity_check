import type { Attempt } from '../core/storage'

/** 直近20回のタイムの推移（折れ線） */
export function HistoryChart({ attempts }: { attempts: Attempt[] }) {
  const data = attempts.filter((a) => a.timeMs > 0).slice(-20).map((a) => a.timeMs / 1000)
  if (data.length < 2) {
    return <p className="text-sm text-slate-500">2回以上取り組むと、ここにタイムの推移が表示されます。</p>
  }
  const W = 320
  const H = 140
  const pad = { l: 34, r: 10, t: 10, b: 22 }
  const lo = Math.min(...data)
  const hi = Math.max(...data)
  const span = Math.max(hi - lo, 1)
  const y0 = Math.max(0, lo - span * 0.15)
  const y1 = hi + span * 0.15
  const x = (i: number) => pad.l + ((W - pad.l - pad.r) * i) / (data.length - 1)
  const y = (v: number) => pad.t + ((H - pad.t - pad.b) * (y1 - v)) / (y1 - y0)
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const best = Math.min(...data)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="タイムの推移">
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#94a3b8" />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#94a3b8" />
      {[y0, (y0 + y1) / 2, y1].map((v, i) => (
        <text key={i} x={pad.l - 4} y={y(v) + 4} fontSize={10} textAnchor="end" fill="#64748b">
          {v.toFixed(0)}
        </text>
      ))}
      <text x={pad.l} y={H - 6} fontSize={10} fill="#64748b">古い</text>
      <text x={W - pad.r} y={H - 6} fontSize={10} fill="#64748b" textAnchor="end">最新（秒）</text>
      <line x1={pad.l} x2={W - pad.r} y1={y(best)} y2={y(best)} stroke="#009e73" strokeDasharray="4 4" />
      <polyline points={pts} fill="none" stroke="#0072b2" strokeWidth={2} />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 4.5 : 3} fill={i === data.length - 1 ? '#d55e00' : '#0072b2'} />
      ))}
    </svg>
  )
}
