// 収録問題（20状況）。正誤ラベルは書かず、式エンジンが計算して決める。
// gives は「誤った式がその検算でどんな値になるか」の説明用データで、テストで数値検証する。
import type { Dim } from '../core/dim'
import type { Sampling } from '../core/checks'
import { DIMS } from './symbols'

export type UnitGroup = 'basic' | 'mech' | 'other'

export type LimitCheck = {
  type: 'limit'
  /** 近づける文字 */
  v: string
  /** 近づける先。'0' / 'inf' / 式 */
  to: string
  /** 小さい側から近づけるとき 'below' */
  side?: 'below'
  /** 正しい式がとる値（'inf' は無限大） */
  expect: string
  /** 条件の短い表記（例: θ=0） */
  cond: string
  /** 条件の文（例: θ=0（水平な面）のとき） */
  when: string
  /** 「になる」（ちょうどその値）か「に近づく」（近づけていく） */
  verb: 'になる' | 'に近づく'
  /** 物理的な理由（例: 水平な面なら加速度は 0 のはず） */
  text: string
  /** レベル2で「誤っている説明」に使う値。正しい式の値と異なることをテストで確認する */
  alts: string[]
  /** 誤った式 → そのときの値（'inf' は無限大）。レベル4の解説に使う */
  gives?: Record<string, string>
}

export type TrendWords = { up: string; down: string; flat: string }

export type TrendCheck = {
  type: 'trend'
  v: string
  /** 正しい式での動き */
  expect: 'up' | 'down' | 'flat'
  /** 前半の文（例: μ′ が大きいほど） */
  lead: string
  /** 後半の文。大きくなる／小さくなる／変わらない のそれぞれ */
  words: TrendWords
}

export type Check = LimitCheck | TrendCheck

export type Situation = {
  id: string
  unit: UnitGroup
  title: string
  figure: string
  target: { tex: string; name: string; unit: string; dim: Dim }
  vars: string[]
  sampling: Sampling
  correct: string
  wrongs: string[]
  checks: Check[]
}

const { L, T, V, A, F, TEMP, OHM, FREQ } = DIMS

/** 増減の文の後半をつくる */
const W = (noun: string, up: string, down: string): TrendWords => ({
  up: `${noun}は${up}`,
  down: `${noun}は${down}`,
  flat: `${noun}は変わらない`,
})
const ACC = W('加速度', '大きい', '小さい')
const PERIOD = W('周期', '長い', '短い')

export const SITUATIONS: Situation[] = [
  // ---------- 物理基礎・力学 ----------
  {
    id: 'S01',
    unit: 'basic',
    title: '高さ h から自由落下させた物体が、地面に着くまでの時間',
    figure: 'freefall',
    target: { tex: 't', name: '時間', unit: 's', dim: T },
    vars: ['h', 'g', 'm'],
    sampling: {},
    correct: 'sqrt(2*h/g)',
    wrongs: ['sqrt(2*g*h)', '2*h/g', 'sqrt(g/(2*h))'],
    checks: [
      { type: 'trend', v: 'h', expect: 'up', lead: 'h が大きいほど', words: W('落ちるまでの時間', '長い', '短い') },
      { type: 'trend', v: 'm', expect: 'flat', lead: '物体の質量 m が大きいほど', words: W('落ちるまでの時間', '長い', '短い') },
    ],
  },
  {
    id: 'S02',
    unit: 'basic',
    title: '高さ h から自由落下させた物体が、地面に着く直前の速さ',
    figure: 'freefall',
    target: { tex: 'v', name: '速さ', unit: 'm/s', dim: V },
    vars: ['h', 'g', 'm'],
    sampling: {},
    correct: 'sqrt(2*g*h)',
    wrongs: ['2*g*h', 'sqrt(2*h/g)', 'sqrt(2*g/h)'],
    checks: [
      { type: 'trend', v: 'h', expect: 'up', lead: 'h が大きいほど', words: W('着く直前の速さ', '大きい', '小さい') },
      { type: 'trend', v: 'm', expect: 'flat', lead: '物体の質量 m が大きいほど', words: W('着く直前の速さ', '大きい', '小さい') },
    ],
  },
  {
    id: 'S03',
    unit: 'basic',
    title: '傾き θ のなめらかな斜面をすべる物体の、加速度の大きさ',
    figure: 'slope',
    target: { tex: 'a', name: '加速度', unit: 'm/s²', dim: A },
    vars: ['g', 'th', 'm'],
    sampling: { ranges: { th: [0.3, 1.2] } },
    correct: 'g*sin(th)',
    wrongs: ['g*cos(th)', 'g/sin(th)', 'g*tan(th)', 'm*g*sin(th)'],
    checks: [
      {
        type: 'limit', v: 'th', to: '0', expect: '0', cond: 'θ=0', when: 'θ=0（水平な面）のとき', verb: 'になる',
        text: 'θ=0（水平な面）なら、加速度は 0 のはず',
        alts: ['g', 'inf'],
        gives: { 'g*cos(th)': 'g', 'g/sin(th)': 'inf' },
      },
      {
        type: 'limit', v: 'th', to: 'pi/2', side: 'below', expect: 'g', cond: 'θ=90°', when: 'θ=90°（鉛直な面）のとき', verb: 'になる',
        text: 'θ=90°（鉛直な面）なら、加速度は g のはず',
        alts: ['0', 'inf'],
        gives: { 'g*cos(th)': '0', 'g*tan(th)': 'inf', 'm*g*sin(th)': 'm*g' },
      },
      { type: 'trend', v: 'th', expect: 'up', lead: 'θ が大きいほど', words: ACC },
      { type: 'trend', v: 'm', expect: 'flat', lead: '物体の質量 m が大きいほど', words: ACC },
    ],
  },
  {
    id: 'S04',
    unit: 'basic',
    title: '傾き θ のあらい斜面（動摩擦係数 μ′）をすべり下りる物体の、加速度の大きさ',
    figure: 'slope_friction',
    target: { tex: 'a', name: '加速度', unit: 'm/s²', dim: A },
    vars: ['g', 'th', 'mu'],
    sampling: { ranges: { th: [0.5, 1.2], mu: [0.05, 0.3] } },
    correct: 'g*(sin(th) - mu*cos(th))',
    wrongs: ['g*(sin(th) + mu*cos(th))', 'g*(cos(th) - mu*sin(th))', 'g*sin(th) - mu'],
    checks: [
      {
        type: 'limit', v: 'mu', to: '0', expect: 'g*sin(th)', cond: 'μ′=0', when: 'μ′=0（摩擦がない）のとき', verb: 'になる',
        text: '摩擦がなければ（μ′=0）、加速度は g sinθ のはず',
        alts: ['g*cos(th)', 'g', '0'],
        gives: { 'g*(cos(th) - mu*sin(th))': 'g*cos(th)' },
      },
      { type: 'trend', v: 'mu', expect: 'down', lead: 'μ′ が大きいほど', words: ACC },
      { type: 'trend', v: 'th', expect: 'up', lead: 'θ が大きいほど', words: ACC },
    ],
  },
  {
    id: 'S05',
    unit: 'basic',
    title: '定滑車にかけた糸の両端に質量 M と m（M > m）のおもりをつるしたときの、加速度の大きさ',
    figure: 'atwood',
    target: { tex: 'a', name: '加速度', unit: 'm/s²', dim: A },
    vars: ['M', 'm', 'g'],
    sampling: { greater: [['M', 'm']] },
    correct: '(M - m)*g/(M + m)',
    wrongs: ['(M + m)*g/(M - m)', '(M - m)*g/(M*m)', 'M*g/(M + m)'],
    checks: [
      {
        type: 'limit', v: 'M', to: 'm', expect: '0', cond: 'M=m', when: 'M=m のとき', verb: 'になる',
        text: 'M=m（つり合う）なら、加速度は 0 のはず',
        alts: ['g', 'g/2'],
        gives: { '(M + m)*g/(M - m)': 'inf', 'M*g/(M + m)': 'g/2' },
      },
      {
        type: 'limit', v: 'm', to: '0', expect: 'g', cond: 'm→0', when: 'm を 0 に近づけると', verb: 'に近づく',
        text: 'm が 0 に近ければ、M は自由落下に近い（加速度は g）はず',
        alts: ['0', 'g/2', 'inf'],
        gives: { '(M - m)*g/(M*m)': 'inf' },
      },
      { type: 'trend', v: 'M', expect: 'up', lead: 'M が大きいほど', words: ACC },
      { type: 'trend', v: 'm', expect: 'down', lead: 'm が大きいほど（M に近づくほど）', words: ACC },
    ],
  },
  {
    id: 'S06',
    unit: 'basic',
    title: '定滑車にかけた糸の両端に質量 M と m（M > m）のおもりをつるしたときの、糸の張力の大きさ',
    figure: 'atwood',
    target: { tex: 'S', name: '張力', unit: 'N', dim: F },
    vars: ['M', 'm', 'g'],
    sampling: { greater: [['M', 'm']] },
    correct: '2*M*m*g/(M + m)',
    wrongs: ['(M + m)*g/2', '2*M*m/(M + m)', '2*M*m*g/(M - m)'],
    checks: [
      {
        type: 'limit', v: 'm', to: '0', expect: '0', cond: 'm→0', when: 'm を 0 に近づけると', verb: 'に近づく',
        text: 'm が 0 に近ければ、糸はほとんど引かれない（張力は 0）はず',
        alts: ['M*g', 'M*g/2'],
        gives: { '(M + m)*g/2': 'M*g/2' },
      },
      {
        type: 'limit', v: 'M', to: 'm', expect: 'm*g', cond: 'M=m', when: 'M=m のとき', verb: 'になる',
        text: 'M=m（つり合う）なら、張力は mg のはず',
        alts: ['0', '2*m*g', 'm*g/2'],
        gives: { '2*M*m/(M + m)': 'm', '2*M*m*g/(M - m)': 'inf' },
      },
      { type: 'trend', v: 'm', expect: 'up', lead: 'm が大きいほど', words: W('張力', '大きい', '小さい') },
      { type: 'trend', v: 'M', expect: 'up', lead: 'M が大きいほど', words: W('張力', '大きい', '小さい') },
    ],
  },
  {
    id: 'S07',
    unit: 'basic',
    title: 'なめらかな机の上の台車（質量 M）を、滑車を通してつるしたおもり（質量 m）が引くときの、加速度の大きさ',
    figure: 'cart_pulley',
    target: { tex: 'a', name: '加速度', unit: 'm/s²', dim: A },
    vars: ['M', 'm', 'g'],
    sampling: {},
    correct: 'm*g/(M + m)',
    wrongs: ['M*g/(M + m)', 'm*g/M', 'm*g/(M - m)'],
    checks: [
      {
        type: 'limit', v: 'm', to: '0', expect: '0', cond: 'm→0', when: 'おもり m を 0 に近づけると', verb: 'に近づく',
        text: 'おもりが 0 に近ければ、加速度は 0 のはず',
        alts: ['g', 'inf'],
        gives: { 'M*g/(M + m)': 'g' },
      },
      {
        type: 'limit', v: 'M', to: '0', expect: 'g', cond: 'M→0', when: '台車 M を 0 に近づけると', verb: 'に近づく',
        text: '台車が 0 に近ければ、おもりは自由落下に近い（加速度は g）はず',
        alts: ['0', 'inf'],
        gives: { 'M*g/(M + m)': '0', 'm*g/M': 'inf', 'm*g/(M - m)': '-g' },
      },
      { type: 'trend', v: 'm', expect: 'up', lead: 'おもり m が大きいほど', words: ACC },
      { type: 'trend', v: 'M', expect: 'down', lead: '台車 M が大きいほど', words: ACC },
    ],
  },

  // ---------- 物理・力学 ----------
  {
    id: 'S08',
    unit: 'mech',
    title: '初速 v₀、仰角 θ で投げた物体の、最高点の高さ',
    figure: 'projectile',
    target: { tex: 'H', name: '高さ', unit: 'm', dim: L },
    vars: ['v0', 'th', 'g'],
    sampling: { ranges: { th: [0.3, 1.2] } },
    correct: 'v0^2*sin(th)^2/(2*g)',
    wrongs: ['v0^2*cos(th)^2/(2*g)', 'v0*sin(th)^2/(2*g)', 'v0^2*tan(th)^2/(2*g)'],
    checks: [
      {
        type: 'limit', v: 'th', to: '0', expect: '0', cond: 'θ=0', when: 'θ=0（水平に投げる）のとき', verb: 'になる',
        text: 'θ=0（水平に投げる）なら、それ以上は上がらない（高さ 0）はず',
        alts: ['v0^2/(2*g)', 'v0^2/g'],
        gives: { 'v0^2*cos(th)^2/(2*g)': 'v0^2/(2*g)' },
      },
      {
        type: 'limit', v: 'th', to: 'pi/2', side: 'below', expect: 'v0^2/(2*g)', cond: 'θ=90°', when: 'θ=90°（真上に投げる）のとき', verb: 'になる',
        text: 'θ=90°（真上に投げる）なら、鉛直投げ上げの高さ v₀²/2g のはず',
        alts: ['0', 'v0^2/g', 'inf'],
        gives: { 'v0^2*cos(th)^2/(2*g)': '0', 'v0*sin(th)^2/(2*g)': 'v0/(2*g)', 'v0^2*tan(th)^2/(2*g)': 'inf' },
      },
      { type: 'trend', v: 'th', expect: 'up', lead: 'θ が大きいほど', words: W('最高点の高さ', '高い', '低い') },
      { type: 'trend', v: 'v0', expect: 'up', lead: 'v₀ が大きいほど', words: W('最高点の高さ', '高い', '低い') },
    ],
  },
  {
    id: 'S09',
    unit: 'mech',
    title: '初速 v₀、仰角 θ で水平な地面から投げた物体の、水平到達距離',
    figure: 'projectile',
    target: { tex: 'x', name: '距離', unit: 'm', dim: L },
    vars: ['v0', 'th', 'g'],
    sampling: { ranges: { th: [0.3, 1.2] } },
    correct: 'v0^2*sin(2*th)/g',
    wrongs: ['v0^2*cos(2*th)/g', 'v0*sin(2*th)/g', 'v0^2*sin(th)/g'],
    checks: [
      {
        type: 'limit', v: 'th', to: '0', expect: '0', cond: 'θ=0', when: 'θ=0（地面すれすれに投げる）のとき', verb: 'になる',
        text: 'θ=0（地面すれすれに投げる）なら、すぐ地面に着く（距離 0）はず',
        alts: ['v0^2/g', 'inf'],
        gives: { 'v0^2*cos(2*th)/g': 'v0^2/g' },
      },
      {
        type: 'limit', v: 'th', to: 'pi/2', side: 'below', expect: '0', cond: 'θ=90°', when: 'θ=90°（真上に投げる）のとき', verb: 'になる',
        text: 'θ=90°（真上に投げる）なら、元の場所に落ちる（距離 0）はず',
        alts: ['v0^2/g', 'v0^2/(2*g)'],
        gives: { 'v0^2*cos(2*th)/g': '-v0^2/g', 'v0^2*sin(th)/g': 'v0^2/g' },
      },
      { type: 'trend', v: 'v0', expect: 'up', lead: 'v₀ が大きいほど', words: W('水平到達距離', '長い', '短い') },
    ],
  },
  {
    id: 'S10',
    unit: 'mech',
    title: 'ばね定数 k のばねにつけた質量 m のおもりの、振動の周期',
    figure: 'spring',
    target: { tex: 'T', name: '周期', unit: 's', dim: T },
    vars: ['m', 'k'],
    sampling: {},
    correct: '2*pi*sqrt(m/k)',
    wrongs: ['2*pi*sqrt(k/m)', '2*pi*m/k', '2*pi*sqrt(m*k)'],
    checks: [
      { type: 'trend', v: 'm', expect: 'up', lead: 'おもりが重い（m が大きい）ほど', words: PERIOD },
      { type: 'trend', v: 'k', expect: 'down', lead: 'ばねがかたい（k が大きい）ほど', words: PERIOD },
    ],
  },
  {
    id: 'S11',
    unit: 'mech',
    title: '長さ L の糸に質量 m のおもりをつけた単振り子の周期',
    figure: 'pendulum',
    target: { tex: 'T', name: '周期', unit: 's', dim: T },
    vars: ['L', 'g', 'm'],
    sampling: {},
    correct: '2*pi*sqrt(L/g)',
    wrongs: ['2*pi*sqrt(g/L)', '2*pi*L/g', '2*pi*sqrt(L/(m*g))'],
    checks: [
      { type: 'trend', v: 'L', expect: 'up', lead: '糸が長い（L が大きい）ほど', words: PERIOD },
      { type: 'trend', v: 'm', expect: 'flat', lead: 'おもりが重い（m が大きい）ほど', words: PERIOD },
      { type: 'trend', v: 'g', expect: 'down', lead: '重力加速度 g が大きい場所ほど', words: PERIOD },
    ],
  },
  {
    id: 'S12',
    unit: 'mech',
    title: '長さ L の糸が鉛直と角 θ をなして回る、円錐振り子の周期',
    figure: 'conical',
    target: { tex: 'T', name: '周期', unit: 's', dim: T },
    vars: ['L', 'th', 'g'],
    sampling: { ranges: { th: [0.3, 1.2] } },
    correct: '2*pi*sqrt(L*cos(th)/g)',
    wrongs: ['2*pi*sqrt(L*sin(th)/g)', '2*pi*sqrt(L/(g*cos(th)))', '2*pi*sqrt(g*cos(th)/L)'],
    checks: [
      {
        type: 'limit', v: 'th', to: '0', expect: '2*pi*sqrt(L/g)', cond: 'θ→0', when: 'θ を 0 に近づけると', verb: 'に近づく',
        text: 'θ が 0 に近ければ、単振り子の周期 2π√(L/g) に近づくはず',
        alts: ['0', 'inf'],
        gives: { '2*pi*sqrt(L*sin(th)/g)': '0', '2*pi*sqrt(g*cos(th)/L)': '2*pi*sqrt(g/L)' },
      },
      {
        type: 'limit', v: 'th', to: 'pi/2', side: 'below', expect: '0', cond: 'θ→90°', when: 'θ を 90° に近づけると', verb: 'に近づく',
        text: 'θ が 90° に近い（とても速く回す）なら、周期は 0 に近づくはず',
        alts: ['2*pi*sqrt(L/g)', 'inf'],
        gives: { '2*pi*sqrt(L*sin(th)/g)': '2*pi*sqrt(L/g)', '2*pi*sqrt(L/(g*cos(th)))': 'inf' },
      },
      { type: 'trend', v: 'th', expect: 'down', lead: 'θ が大きい（速く回す）ほど', words: PERIOD },
      { type: 'trend', v: 'L', expect: 'up', lead: '糸が長い（L が大きい）ほど', words: PERIOD },
    ],
  },
  {
    id: 'S13',
    unit: 'mech',
    title: '速さ v で進む質量 m の物体が、静止した質量 M の物体と一体になった後の速さ',
    figure: 'collision_stick',
    target: { tex: "v'", name: '速さ', unit: 'm/s', dim: V },
    vars: ['m', 'M', 'v'],
    sampling: {},
    correct: 'm*v/(M + m)',
    wrongs: ['M*v/(M + m)', 'm*v/(M - m)', '(M + m)*v/m'],
    checks: [
      {
        type: 'limit', v: 'M', to: '0', expect: 'v', cond: 'M→0', when: 'M を 0 に近づけると', verb: 'に近づく',
        text: 'M が 0 に近ければ、速さは v のまま変わらないはず',
        alts: ['0', 'v/2', 'inf'],
        gives: { 'M*v/(M + m)': '0', 'm*v/(M - m)': '-v' },
      },
      {
        type: 'limit', v: 'M', to: 'inf', expect: '0', cond: 'M→∞', when: 'M をどこまでも大きくすると', verb: 'に近づく',
        text: 'M がとても大きい（壁のようなもの）なら、ほとんど止まる（速さ 0）はず',
        alts: ['v', 'v/2'],
        gives: { 'M*v/(M + m)': 'v', '(M + m)*v/m': 'inf' },
      },
      {
        type: 'limit', v: 'M', to: 'm', expect: 'v/2', cond: 'M=m', when: 'M=m のとき', verb: 'になる',
        text: '同じ質量どうし（M=m）なら、速さは半分（v/2）になるはず',
        alts: ['v', '0', 'v/4'],
        gives: { 'm*v/(M - m)': 'inf', '(M + m)*v/m': '2*v' },
      },
      { type: 'trend', v: 'M', expect: 'down', lead: 'M が大きいほど', words: W('一体になった後の速さ', '大きい', '小さい') },
      { type: 'trend', v: 'm', expect: 'up', lead: 'm が大きいほど', words: W('一体になった後の速さ', '大きい', '小さい') },
      { type: 'trend', v: 'v', expect: 'up', lead: 'はじめの速さ v が大きいほど', words: W('一体になった後の速さ', '大きい', '小さい') },
    ],
  },
  {
    id: 'S14',
    unit: 'mech',
    title: '速度 v で進む質量 m の球が、静止した質量 M の球と正面から弾性衝突した後の、m の速度',
    figure: 'collision_elastic',
    target: { tex: "v'", name: '速度', unit: 'm/s', dim: V },
    vars: ['m', 'M', 'v'],
    sampling: {},
    correct: '(m - M)*v/(m + M)',
    wrongs: ['(m + M)*v/(m - M)', '(M - m)*v/(m + M)', '(m - M)*v/(m*M)'],
    checks: [
      {
        type: 'limit', v: 'M', to: 'm', expect: '0', cond: 'M=m', when: 'M=m のとき', verb: 'になる',
        text: 'M=m なら、m は止まる（速度 0）はず',
        alts: ['v', '-v', 'v/2'],
        gives: { '(m + M)*v/(m - M)': 'inf' },
      },
      {
        type: 'limit', v: 'M', to: '0', expect: 'v', cond: 'M→0', when: 'M を 0 に近づけると', verb: 'に近づく',
        text: 'M が 0 に近ければ、m は速度 v のまま進むはず',
        alts: ['0', '-v', '2*v'],
        gives: { '(M - m)*v/(m + M)': '-v', '(m - M)*v/(m*M)': 'inf' },
      },
      {
        type: 'limit', v: 'M', to: 'inf', expect: '-v', cond: 'M→∞', when: 'M をどこまでも大きくすると', verb: 'に近づく',
        text: 'M がとても大きい（壁のようなもの）なら、m は同じ速さではね返る（速度 −v）はず',
        alts: ['0', 'v'],
        gives: { '(M - m)*v/(m + M)': 'v', '(m - M)*v/(m*M)': '-v/m' },
      },
    ],
  },
  {
    id: 'S19',
    unit: 'mech',
    title: '地表すれすれを回る人工衛星の速さ（第一宇宙速度）。地表の重力加速度 g、地球の半径 R',
    figure: 'orbit_surface',
    target: { tex: 'v', name: '速さ', unit: 'm/s', dim: V },
    vars: ['g', 'R'],
    sampling: {},
    correct: 'sqrt(g*R)',
    wrongs: ['sqrt(g/R)', 'g*R', 'sqrt(R/g)'],
    checks: [],
  },
  {
    id: 'S20',
    unit: 'mech',
    title: '質量 M の天体のまわりを、半径 r の円軌道で回る衛星の周期（万有引力定数 G）',
    figure: 'orbit',
    target: { tex: 'T', name: '周期', unit: 's', dim: T },
    vars: ['r', 'G', 'M'],
    sampling: {},
    correct: '2*pi*sqrt(r^3/(G*M))',
    wrongs: ['2*pi*sqrt(G*M/r^3)', '2*pi*sqrt(r^2/(G*M))', '2*pi*r^3/(G*M)'],
    checks: [
      { type: 'trend', v: 'r', expect: 'up', lead: '軌道半径 r が大きいほど', words: PERIOD },
      { type: 'trend', v: 'M', expect: 'down', lead: '天体の質量 M が大きいほど', words: PERIOD },
    ],
  },

  // ---------- 熱・波・電気 ----------
  {
    id: 'S15',
    unit: 'other',
    title: '温度 T₁ の水 m₁ と、温度 T₂ の水 m₂ を混ぜた後の温度',
    figure: 'mixing',
    target: { tex: 'T', name: '温度', unit: 'K', dim: TEMP },
    vars: ['m1', 'T1', 'm2', 'T2'],
    sampling: {},
    correct: '(m1*T1 + m2*T2)/(m1 + m2)',
    wrongs: ['(T1 + T2)/2', '(m1*T2 + m2*T1)/(m1 + m2)', '(m1*T1 + m2*T2)/(m1*m2)'],
    checks: [
      {
        type: 'limit', v: 'm2', to: '0', expect: 'T1', cond: 'm₂→0', when: 'm₂ を 0 に近づけると', verb: 'に近づく',
        text: 'm₂ が 0 に近ければ、温度は T₁ のまま変わらないはず',
        alts: ['T2', '(T1 + T2)/2'],
        gives: { '(T1 + T2)/2': '(T1 + T2)/2', '(m1*T2 + m2*T1)/(m1 + m2)': 'T2', '(m1*T1 + m2*T2)/(m1*m2)': 'inf' },
      },
      {
        type: 'limit', v: 'T2', to: 'T1', expect: 'T1', cond: 'T₁=T₂', when: 'T₁=T₂ のとき', verb: 'になる',
        text: '同じ温度どうし（T₁=T₂）なら、混ぜても T₁ のままのはず',
        alts: ['2*T1', 'T1/2'],
        gives: { '(m1*T1 + m2*T2)/(m1*m2)': 'T1*(m1 + m2)/(m1*m2)' },
      },
      {
        type: 'limit', v: 'm2', to: 'm1', expect: '(T1 + T2)/2', cond: 'm₁=m₂', when: 'm₁=m₂ のとき', verb: 'になる',
        text: '同じ量どうし（m₁=m₂）なら、ちょうど真ん中の温度になるはず',
        alts: ['T1', 'T2', 'T1 + T2'],
        gives: { '(m1*T1 + m2*T2)/(m1*m2)': '(T1 + T2)/m1' },
      },
      { type: 'trend', v: 'T2', expect: 'up', lead: 'T₂ が高いほど', words: W('混ぜた後の温度', '高い', '低い') },
    ],
  },
  {
    id: 'S16',
    unit: 'other',
    title: '抵抗 R₁ と R₂ を並列につないだときの合成抵抗',
    figure: 'parallel',
    target: { tex: 'R', name: '抵抗', unit: 'Ω', dim: OHM },
    vars: ['R1', 'R2'],
    sampling: {},
    correct: 'R1*R2/(R1 + R2)',
    wrongs: ['(R1 + R2)/(R1*R2)', 'R1*R2/(R1 - R2)', '(R1 + R2)/2'],
    checks: [
      {
        type: 'limit', v: 'R2', to: 'inf', expect: 'R1', cond: 'R₂→∞', when: 'R₂ をどこまでも大きくすると', verb: 'に近づく',
        text: 'R₂ がとても大きい（電流が流れない）なら、R₁ だけと同じはず',
        alts: ['0', 'R1/2', 'inf'],
        gives: { '(R1 + R2)/(R1*R2)': '1/R1', 'R1*R2/(R1 - R2)': '-R1', '(R1 + R2)/2': 'inf' },
      },
      {
        type: 'limit', v: 'R2', to: '0', expect: '0', cond: 'R₂→0', when: 'R₂ を 0 に近づけると', verb: 'に近づく',
        text: 'R₂ が 0 に近い（導線でつないだのと同じ）なら、合成抵抗は 0 のはず',
        alts: ['R1', 'R1/2', 'inf'],
        gives: { '(R1 + R2)/(R1*R2)': 'inf', '(R1 + R2)/2': 'R1/2' },
      },
      {
        type: 'limit', v: 'R2', to: 'R1', expect: 'R1/2', cond: 'R₁=R₂', when: 'R₁=R₂ のとき', verb: 'になる',
        text: '同じ抵抗どうし（R₁=R₂）なら、半分になるはず',
        alts: ['R1', '2*R1'],
        gives: { '(R1 + R2)/(R1*R2)': '2/R1', 'R1*R2/(R1 - R2)': 'inf', '(R1 + R2)/2': 'R1' },
      },
      { type: 'trend', v: 'R2', expect: 'up', lead: 'R₂ が大きいほど', words: W('合成抵抗', '大きい', '小さい') },
    ],
  },
  {
    id: 'S17',
    unit: 'other',
    title: '長さ L、張力 S、線密度 ρ の弦の、基本振動の振動数',
    figure: 'string',
    target: { tex: 'f', name: '振動数', unit: 'Hz（＝1/s）', dim: FREQ },
    vars: ['L', 'St', 'rho'],
    sampling: {},
    correct: 'sqrt(St/rho)/(2*L)',
    wrongs: ['sqrt(rho/St)/(2*L)', '2*L*sqrt(St/rho)', 'St/(2*L*rho)'],
    checks: [
      { type: 'trend', v: 'St', expect: 'up', lead: '強く張る（S が大きい）ほど', words: W('振動数', '大きい（音が高い）', '小さい（音が低い）') },
      { type: 'trend', v: 'L', expect: 'down', lead: '弦が長い（L が大きい）ほど', words: W('振動数', '大きい（音が高い）', '小さい（音が低い）') },
      { type: 'trend', v: 'rho', expect: 'down', lead: '弦が太い（ρ が大きい）ほど', words: W('振動数', '大きい（音が高い）', '小さい（音が低い）') },
    ],
  },
  {
    id: 'S18',
    unit: 'other',
    title: '振動数 f の音源が速さ v で近づくとき、静止した人が聞く音の振動数（音速 V）',
    figure: 'doppler',
    target: { tex: "f'", name: '振動数', unit: 'Hz（＝1/s）', dim: FREQ },
    vars: ['f', 'V', 'v'],
    sampling: { greater: [['V', 'v']] },
    correct: 'f*V/(V - v)',
    wrongs: ['f*V/(V + v)', 'f*(V - v)/V', 'f*v/(V - v)'],
    checks: [
      {
        type: 'limit', v: 'v', to: '0', expect: 'f', cond: 'v=0', when: 'v=0（音源が止まっている）のとき', verb: 'になる',
        text: '音源が止まっていれば（v=0）、聞こえる振動数は f のままのはず',
        alts: ['0', 'inf'],
        gives: { 'f*v/(V - v)': '0' },
      },
      {
        type: 'limit', v: 'v', to: 'V', side: 'below', expect: 'inf', cond: 'v→V',
        when: '音源の速さ v を音速 V に近づけると', verb: 'に近づく',
        text: '音源が音速に近づくと、前方の波がつまって、振動数はいくらでも大きくなるはず',
        alts: ['f', '2*f', '0'],
        gives: { 'f*V/(V + v)': 'f/2', 'f*(V - v)/V': '0' },
      },
      { type: 'trend', v: 'v', expect: 'up', lead: '音源が速く近づく（v が大きい）ほど', words: W('聞こえる振動数', '大きい（音が高い）', '小さい（音が低い）') },
    ],
  },
]

export const UNIT_GROUP_LABEL: Record<UnitGroup, string> = {
  basic: '物理基礎・力学',
  mech: '物理・力学',
  other: '熱・波・電気',
}
