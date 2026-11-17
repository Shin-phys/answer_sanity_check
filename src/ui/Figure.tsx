import { useId, type ReactNode } from 'react'

/** 状況図。線画のみで、どの図も 200×120 の枠に描く */
export function Figure({ name, className }: { name: string; className?: string }) {
  const id = useId().replace(/:/g, '')
  const arrow = `url(#arr-${id})`
  const body = FIGURES[name]?.(arrow)
  if (!body) return null
  return (
    <svg
      viewBox="0 0 200 120"
      className={className}
      role="img"
      aria-label="状況の図"
      fill="none"
      stroke="#334155"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <marker id={`arr-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#d55e00" stroke="none" />
        </marker>
      </defs>
      {body}
    </svg>
  )
}

const Label = ({ x, y, children, plain }: { x: number; y: number; children: ReactNode; plain?: boolean }) => (
  <text
    x={x}
    y={y}
    fill="#0f172a"
    stroke="none"
    fontSize={13}
    fontStyle={plain ? 'normal' : 'italic'}
    fontFamily={plain ? 'inherit' : 'Times New Roman, serif'}
    textAnchor="middle"
  >
    {children}
  </text>
)

const Arrow = ({ d, arrow }: { d: string; arrow: string }) => <path d={d} stroke="#d55e00" markerEnd={arrow} />
const ground = (y: number, x1 = 10, x2 = 190) => <path d={`M${x1} ${y} H${x2}`} stroke="#64748b" />
const dash = { strokeDasharray: '4 4', stroke: '#94a3b8', strokeWidth: 1.5 }

/** 斜面（底角 θ）と物体 */
function slope(arrow: string, rough: boolean) {
  const ang = (Math.atan2(70, 160) * 180) / Math.PI
  return (
    <>
      <path d="M20 105 H180 V35 Z" fill="#e2e8f0" />
      {rough && <path d="M50 94 l6 5 M80 81 l6 5 M110 68 l6 5 M140 55 l6 5" stroke="#64748b" strokeWidth={1.5} />}
      <path d="M52 105 A32 32 0 0 0 49 92" strokeWidth={1.5} />
      <Label x={64} y={101}>θ</Label>
      <g transform={`translate(104 60) rotate(${-ang})`}>
        <rect x={-14} y={-10} width={28} height={18} fill="#fff" />
        <Arrow d="M-18 -1 H-44" arrow={arrow} />
      </g>
      {rough && <Label x={150} y={30}>μ′</Label>}
    </>
  )
}

const FIGURES: Record<string, (arrow: string) => ReactNode> = {
  freefall: (arrow) => (
    <>
      {ground(108)}
      <circle cx={90} cy={18} r={8} fill="#fff" />
      <path d="M90 28 V106" {...dash} />
      <Arrow d="M106 14 V44" arrow={arrow} />
      <Label x={118} y={34}>g</Label>
      <path d="M150 12 V106 M144 12 H156 M144 106 H156" strokeWidth={1.5} />
      <Label x={164} y={64}>h</Label>
    </>
  ),
  slope: (arrow) => slope(arrow, false),
  slope_friction: (arrow) => slope(arrow, true),
  atwood: (arrow) => (
    <>
      <path d="M60 6 H140" stroke="#64748b" />
      <path d="M100 6 V14" />
      <circle cx={100} cy={28} r={14} fill="#fff" />
      <path d="M86 28 V78 M114 28 V56" />
      <rect x={72} y={78} width={28} height={26} fill="#fff" />
      <rect x={105} y={56} width={18} height={16} fill="#fff" />
      <Label x={86} y={96}>M</Label>
      <Label x={133} y={69}>m</Label>
      <Arrow d="M62 84 V104" arrow={arrow} />
      <Arrow d="M152 76 V56" arrow={arrow} />
    </>
  ),
  cart_pulley: (arrow) => (
    <>
      <path d="M10 62 H140 V112" stroke="#64748b" />
      <rect x={44} y={40} width={40} height={16} fill="#fff" />
      <circle cx={53} cy={58} r={4} fill="#fff" />
      <circle cx={75} cy={58} r={4} fill="#fff" />
      <Label x={64} y={34}>M</Label>
      <circle cx={147} cy={55} r={7} fill="#fff" />
      <path d="M84 48 H147 M154 55 V82" />
      <rect x={145} y={82} width={18} height={18} fill="#fff" />
      <Label x={176} y={96}>m</Label>
      <Arrow d="M96 34 H120" arrow={arrow} />
    </>
  ),
  projectile: (arrow) => (
    <>
      {ground(100)}
      <path d="M20 100 Q100 -40 180 100" {...dash} />
      <Arrow d="M20 100 L38 68" arrow={arrow} />
      <path d="M44 100 A24 24 0 0 0 32 79" strokeWidth={1.5} />
      <Label x={52} y={92}>θ</Label>
      <Label x={24} y={62}>v₀</Label>
      <path d="M100 32 V98 M94 32 H106" strokeWidth={1.5} />
      <Label x={112} y={68}>H</Label>
      <path d="M20 110 H180 M20 106 V114 M180 106 V114" strokeWidth={1.5} />
      <Label x={150} y={96}>x</Label>
    </>
  ),
  spring: () => (
    <>
      <path d="M20 30 V92" stroke="#64748b" strokeWidth={3} />
      <path d="M20 92 H190" stroke="#64748b" />
      <path d="M20 72 H30 l5 -9 l10 18 l10 -18 l10 18 l10 -18 l10 18 l10 -18 l10 18 l5 -9 H120" />
      <rect x={120} y={56} width={34} height={34} fill="#fff" />
      <Label x={137} y={78}>m</Label>
      <Label x={72} y={48}>k</Label>
    </>
  ),
  pendulum: () => (
    <>
      <path d="M60 10 H140" stroke="#64748b" />
      <path d="M100 10 V100" {...dash} />
      <path d="M100 10 L142 88" />
      <circle cx={146} cy={95} r={9} fill="#fff" />
      <Label x={132} y={48}>L</Label>
      <Label x={166} y={100}>m</Label>
    </>
  ),
  conical: () => (
    <>
      <path d="M60 10 H140" stroke="#64748b" />
      <path d="M100 10 V104" {...dash} />
      <ellipse cx={100} cy={88} rx={48} ry={11} {...dash} />
      <path d="M100 10 L146 84" />
      <circle cx={148} cy={88} r={8} fill="#fff" />
      <path d="M100 34 A24 24 0 0 0 113 30" strokeWidth={1.5} />
      <Label x={110} y={48}>θ</Label>
      <Label x={136} y={46}>L</Label>
    </>
  ),
  collision_stick: (arrow) => (
    <>
      {ground(92)}
      <circle cx={46} cy={80} r={11} fill="#fff" />
      <Label x={46} y={60}>m</Label>
      <Arrow d="M64 80 H96" arrow={arrow} />
      <Label x={80} y={72}>v</Label>
      <rect x={126} y={62} width={40} height={29} fill="#fff" />
      <Label x={146} y={54}>M</Label>
      <Label x={146} y={110} plain>静止</Label>
    </>
  ),
  collision_elastic: (arrow) => (
    <>
      {ground(92)}
      <circle cx={46} cy={80} r={11} fill="#fff" />
      <Label x={46} y={60}>m</Label>
      <Arrow d="M64 80 H96" arrow={arrow} />
      <Label x={80} y={72}>v</Label>
      <circle cx={146} cy={75} r={16} fill="#fff" />
      <Label x={146} y={50}>M</Label>
      <Label x={146} y={110} plain>静止</Label>
    </>
  ),
  mixing: () => (
    <>
      <path d="M28 40 V100 H82 V40" />
      <path d="M30 62 H80" stroke="#0072b2" />
      <Label x={55} y={86}>m₁, T₁</Label>
      <path d="M118 40 V100 H172 V40" />
      <path d="M120 54 H170" stroke="#0072b2" />
      <Label x={145} y={86}>m₂, T₂</Label>
      <Label x={100} y={76} plain>＋</Label>
    </>
  ),
  parallel: () => (
    <>
      <path d="M12 60 H40 M160 60 H188" />
      <path d="M40 32 V88 M160 32 V88" />
      <path d="M40 32 H78 M122 32 H160 M40 88 H78 M122 88 H160" />
      <rect x={78} y={24} width={44} height={16} fill="#fff" />
      <rect x={78} y={80} width={44} height={16} fill="#fff" />
      <Label x={100} y={18}>R₁</Label>
      <Label x={100} y={114}>R₂</Label>
      <circle cx={12} cy={60} r={2.5} fill="#334155" />
      <circle cx={188} cy={60} r={2.5} fill="#334155" />
    </>
  ),
  string: (arrow) => (
    <>
      <path d="M24 44 V92 M176 44 V92" stroke="#64748b" strokeWidth={3} />
      <path d="M24 66 Q100 26 176 66" />
      <path d="M24 66 Q100 106 176 66" {...dash} />
      <path d="M24 106 H176 M24 102 V110 M176 102 V110" strokeWidth={1.5} />
      <Label x={100} y={102}>L</Label>
      <Arrow d="M178 66 H196" arrow={arrow} />
      <Label x={188} y={58}>S</Label>
      <Label x={100} y={40}>ρ</Label>
    </>
  ),
  doppler: (arrow) => (
    <>
      <circle cx={70} cy={60} r={6} fill="#334155" />
      <circle cx={62} cy={60} r={20} strokeWidth={1.5} stroke="#94a3b8" />
      <circle cx={54} cy={60} r={36} strokeWidth={1.5} stroke="#94a3b8" />
      <circle cx={46} cy={60} r={52} strokeWidth={1.5} stroke="#94a3b8" />
      <Arrow d="M80 60 H112" arrow={arrow} />
      <Label x={98} y={52}>v</Label>
      <Label x={70} y={46}>f</Label>
      <circle cx={176} cy={46} r={7} fill="#fff" />
      <path d="M176 53 V82 M176 62 H164 M176 62 H188 M176 82 L168 100 M176 82 L184 100" />
    </>
  ),
  orbit_surface: (arrow) => (
    <>
      <circle cx={100} cy={150} r={110} fill="#e2e8f0" />
      <circle cx={100} cy={32} r={5} fill="#334155" />
      <Arrow d="M110 32 H146" arrow={arrow} />
      <Label x={130} y={24}>v</Label>
      <path d="M100 42 V118" {...dash} />
      <Label x={112} y={90}>R</Label>
      <Label x={60} y={70}>g</Label>
    </>
  ),
  orbit: (arrow) => (
    <>
      <circle cx={100} cy={60} r={46} {...dash} />
      <circle cx={100} cy={60} r={13} fill="#e2e8f0" />
      <Label x={100} y={65}>M</Label>
      <path d="M113 60 H140" strokeWidth={1.5} />
      <Label x={127} y={54}>r</Label>
      <circle cx={146} cy={60} r={5} fill="#334155" />
      <Arrow d="M146 52 V26" arrow={arrow} />
    </>
  ),
}
