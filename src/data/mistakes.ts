// レベル5「まちがい探し」。答案の1行だけに誤りがある。
// 各行の正誤は機械検証しにくいため、追加するときは教員が内容を確認すること。
import type { Part } from '../core/bank'

export type MistakeKind = 'sign' | 'trig' | 'missing' | 'algebra' | 'square'

export const KIND_LABEL: Record<MistakeKind, string> = {
  sign: '力の向き・符号',
  trig: 'sin と cos の取り違え',
  missing: '力の見落とし',
  algebra: '式変形のミス',
  square: '2乗・単位のミス',
}
export const KIND_ORDER: MistakeKind[] = ['sign', 'trig', 'missing', 'algebra', 'square']

export type Mistake = {
  id: string
  title: string
  figure: string
  lines: Part[][]
  /** 誤りのある行（0始まり） */
  wrongLine: number
  kind: MistakeKind
  /** 正しい行 */
  fix: Part[]
  /** 最終結果をどの検算にかければ気づけたか */
  hint: string
}

export const MISTAKES: Mistake[] = [
  {
    id: 'E1',
    title: '傾き θ のあらい斜面（動摩擦係数 μ′）をすべり下りる物体の加速度 a を求める',
    figure: 'slope_friction',
    lines: [
      ['斜面に垂直な方向のつり合い：', { tex: 'N = mg\\cos\\theta' }],
      ['動摩擦力の大きさ：', { tex: "\\mu' N = \\mu' mg\\cos\\theta" }],
      ['斜面方向の運動方程式：', { tex: "ma = mg\\sin\\theta + \\mu' mg\\cos\\theta" }],
      ['よって ', { tex: "a = g(\\sin\\theta + \\mu'\\cos\\theta)" }],
    ],
    wrongLine: 2,
    kind: 'sign',
    fix: ['動摩擦力は運動と逆向き：', { tex: "ma = mg\\sin\\theta - \\mu' mg\\cos\\theta" }],
    hint: '増減でチェック：μ′ が大きいほど a は小さいはず。この結果は μ′ が大きいほど a が大きくなる',
  },
  {
    id: 'E2',
    title: '定滑車にかけた糸の両端に質量 M と m（M > m）のおもりをつるしたときの加速度 a を求める',
    figure: 'atwood',
    lines: [
      ['M の運動方程式：', { tex: 'Ma = Mg - T' }],
      ['m の運動方程式：', { tex: 'ma = T - mg' }],
      ['2式を足して T を消す：', { tex: '(M+m)a = (M+m)g' }],
      ['よって ', { tex: 'a = g' }],
    ],
    wrongLine: 2,
    kind: 'algebra',
    fix: ['右辺は Mg − mg：', { tex: '(M+m)a = (M-m)g' }],
    hint: '特別な場合でチェック：M=m ならつり合って a=0 のはず。この結果は M=m でも a=g になる',
  },
  {
    id: 'E3',
    title: '初速 v₀、仰角 θ で投げた物体の最高点の高さ H を求める',
    figure: 'projectile',
    lines: [
      ['初速度の鉛直成分：', { tex: 'v_0\\cos\\theta' }],
      ['最高点では鉛直方向の速度が 0：', { tex: '0^2 - (v_0\\cos\\theta)^2 = -2gH' }],
      ['よって ', { tex: 'H = \\dfrac{v_0^2\\cos^2\\theta}{2g}' }],
    ],
    wrongLine: 0,
    kind: 'trig',
    fix: ['鉛直成分は sin：', { tex: 'v_0\\sin\\theta' }],
    hint: '特別な場合でチェック：θ=0（水平に投げる）なら H=0 のはず。この結果は θ=0 で 0 にならない',
  },
  {
    id: 'E4',
    title: 'なめらかな水平面を速さ v で進む質量 m の物体が、ばね（ばね定数 k）を最も縮める長さ x を求める',
    figure: 'spring',
    lines: [
      ['はじめの運動エネルギー：', { tex: '\\dfrac{1}{2}mv^2' }],
      ['最も縮んだときの弾性エネルギー：', { tex: '\\dfrac{1}{2}kx' }],
      ['力学的エネルギー保存則より ', { tex: 'x = \\dfrac{mv^2}{k}' }],
    ],
    wrongLine: 1,
    kind: 'square',
    fix: ['弾性エネルギーは x の2乗：', { tex: '\\dfrac{1}{2}kx^2' }],
    hint: '単位でチェック：mv²/k の単位は m²。長さ〔m〕にならない',
  },
]
