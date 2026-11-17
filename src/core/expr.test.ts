import { describe, expect, it } from 'vitest'
import { evaluate, parse, toTex } from './expr'
import { symTex } from '../data/symbols'

describe('式の構文解析と評価', () => {
  it('演算の優先順位', () => {
    expect(evaluate(parse('1+2*3'), {})).toBe(7)
    expect(evaluate(parse('(1+2)*3'), {})).toBe(9)
    expect(evaluate(parse('2*3^2'), {})).toBe(18)
    expect(evaluate(parse('-2^2'), {})).toBe(-4)
    expect(evaluate(parse('8/2/2'), {})).toBe(2)
  })
  it('関数と文字', () => {
    expect(evaluate(parse('sqrt(2*h/g)'), { h: 4.9, g: 9.8 })).toBeCloseTo(1, 12)
    expect(evaluate(parse('sin(pi/2)'), {})).toBeCloseTo(1, 12)
    expect(evaluate(parse('g*(sin(th) - mu*cos(th))'), { g: 10, th: 0, mu: 0.5 })).toBeCloseTo(-5, 12)
  })
  it('不正な式はエラー', () => {
    expect(() => parse('2*')).toThrow()
    expect(() => parse('sqrt(2')).toThrow()
    expect(() => parse('a $ b')).toThrow()
  })
  it('TeX への変換', () => {
    const t = (s: string) => toTex(parse(s), symTex)
    expect(t('sqrt(2*h/g)')).toBe('\\sqrt{\\dfrac{2 h}{g}}')
    expect(t('g*sin(th)')).toBe('g \\sin \\theta')
    expect(t('v0^2*sin(th)^2/(2*g)')).toBe('\\dfrac{v_0^{2} \\sin^{2} \\theta}{2 g}')
    expect(t('g*(sin(th) - mu*cos(th))')).toBe("g \\left(\\sin \\theta-\\mu' \\cos \\theta\\right)")
    expect(t('2*pi*sqrt(m/k)')).toBe('2 \\pi \\sqrt{\\dfrac{m}{k}}')
  })
})
