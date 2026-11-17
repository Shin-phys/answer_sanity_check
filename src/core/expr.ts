// 式の構文解析・数値評価・TeX変換
// 使える要素: 数値, pi, 文字, + - * / ^, かっこ, sqrt() sin() cos() tan()

export type Node =
  | { t: 'num'; v: number }
  | { t: 'sym'; name: string }
  | { t: 'add'; a: Node; b: Node }
  | { t: 'sub'; a: Node; b: Node }
  | { t: 'mul'; a: Node; b: Node }
  | { t: 'div'; a: Node; b: Node }
  | { t: 'pow'; a: Node; b: Node }
  | { t: 'neg'; a: Node }
  | { t: 'fn'; name: FnName; a: Node }

export type FnName = 'sqrt' | 'sin' | 'cos' | 'tan'
const FUNCS: readonly string[] = ['sqrt', 'sin', 'cos', 'tan']

type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string }

function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ') {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      out.push({ k: 'num', v: Number(src.slice(i, j)) })
      i = j
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++
      out.push({ k: 'id', v: src.slice(i, j) })
      i = j
    } else if ('+-*/^()'.includes(c)) {
      out.push({ k: 'op', v: c })
      i++
    } else {
      throw new Error(`式に使えない文字です: "${c}" (${src})`)
    }
  }
  return out
}

/** 文字列の式を構文木にする */
export function parse(src: string): Node {
  const toks = tokenize(src)
  let p = 0
  const peek = () => toks[p]
  const isOp = (v: string) => peek()?.k === 'op' && peek().v === v
  const eat = (v: string) => {
    if (!isOp(v)) throw new Error(`"${v}" が必要です (${src})`)
    p++
  }

  function expr(): Node {
    let n = term()
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v
      const r = term()
      n = op === '+' ? { t: 'add', a: n, b: r } : { t: 'sub', a: n, b: r }
    }
    return n
  }
  function term(): Node {
    let n = unary()
    while (isOp('*') || isOp('/')) {
      const op = toks[p++].v
      const r = unary()
      n = op === '*' ? { t: 'mul', a: n, b: r } : { t: 'div', a: n, b: r }
    }
    return n
  }
  function unary(): Node {
    if (isOp('-')) {
      p++
      return { t: 'neg', a: unary() }
    }
    return power()
  }
  function power(): Node {
    const base = primary()
    if (isOp('^')) {
      p++
      return { t: 'pow', a: base, b: unary() }
    }
    return base
  }
  function primary(): Node {
    const tk = peek()
    if (!tk) throw new Error(`式が途中で終わっています (${src})`)
    if (tk.k === 'num') {
      p++
      return { t: 'num', v: tk.v }
    }
    if (tk.k === 'id') {
      p++
      if (FUNCS.includes(tk.v)) {
        eat('(')
        const a = expr()
        eat(')')
        return { t: 'fn', name: tk.v as FnName, a }
      }
      return { t: 'sym', name: tk.v }
    }
    if (isOp('(')) {
      p++
      const n = expr()
      eat(')')
      return n
    }
    throw new Error(`予期しない記号です: "${tk.v}" (${src})`)
  }

  const n = expr()
  if (p !== toks.length) throw new Error(`式の後ろに余分な記号があります (${src})`)
  return n
}

export type Env = Record<string, number>

/** 数値として評価する。pi は円周率 */
export function evaluate(n: Node, env: Env): number {
  switch (n.t) {
    case 'num':
      return n.v
    case 'sym': {
      if (n.name === 'pi') return Math.PI
      const v = env[n.name]
      if (v === undefined) throw new Error(`値が決まっていない文字です: ${n.name}`)
      return v
    }
    case 'add':
      return evaluate(n.a, env) + evaluate(n.b, env)
    case 'sub':
      return evaluate(n.a, env) - evaluate(n.b, env)
    case 'mul':
      return evaluate(n.a, env) * evaluate(n.b, env)
    case 'div':
      return evaluate(n.a, env) / evaluate(n.b, env)
    case 'pow':
      return Math.pow(evaluate(n.a, env), evaluate(n.b, env))
    case 'neg':
      return -evaluate(n.a, env)
    case 'fn': {
      const x = evaluate(n.a, env)
      if (n.name === 'sqrt') return Math.sqrt(x)
      if (n.name === 'sin') return Math.sin(x)
      if (n.name === 'cos') return Math.cos(x)
      return Math.tan(x)
    }
  }
}

/** 式に現れる文字（pi を除く） */
export function symbolsOf(n: Node, acc: Set<string> = new Set()): Set<string> {
  switch (n.t) {
    case 'num':
      break
    case 'sym':
      if (n.name !== 'pi') acc.add(n.name)
      break
    case 'neg':
    case 'fn':
      symbolsOf(n.a, acc)
      break
    default:
      symbolsOf(n.a, acc)
      symbolsOf(n.b, acc)
  }
  return acc
}

/** 文字の TeX 表記を返す関数 */
export type SymTex = (name: string) => string

function numTex(v: number): string {
  return Number.isInteger(v) ? String(v) : String(v)
}

function isAddLike(n: Node): boolean {
  return n.t === 'add' || n.t === 'sub' || n.t === 'neg'
}

/** 三角関数の引数など、かっこなしで書ける単純な積か */
function isSimpleProduct(n: Node): boolean {
  if (n.t === 'num' || n.t === 'sym') return true
  if (n.t === 'mul') return isSimpleProduct(n.a) && isSimpleProduct(n.b)
  return false
}

/** 構文木を KaTeX 用の TeX にする */
export function toTex(n: Node, sym: SymTex): string {
  switch (n.t) {
    case 'num':
      return numTex(n.v)
    case 'sym':
      return n.name === 'pi' ? '\\pi' : sym(n.name)
    case 'add':
      return `${toTex(n.a, sym)}+${toTex(n.b, sym)}`
    case 'sub': {
      const r = n.b.t === 'add' || n.b.t === 'sub' ? `\\left(${toTex(n.b, sym)}\\right)` : toTex(n.b, sym)
      return `${toTex(n.a, sym)}-${r}`
    }
    case 'neg': {
      const a = n.a.t === 'add' || n.a.t === 'sub' ? `\\left(${toTex(n.a, sym)}\\right)` : toTex(n.a, sym)
      return `-${a}`
    }
    case 'mul': {
      const f = (x: Node) => (isAddLike(x) ? `\\left(${toTex(x, sym)}\\right)` : toTex(x, sym))
      const left = f(n.a)
      const right = f(n.b)
      // 右側が数のときだけ × を入れる。それ以外は並べて書く（空白は TeX の命令名の区切り）
      const needTimes = n.b.t === 'num'
      return needTimes ? `${left}\\times ${right}` : `${left} ${right}`
    }
    case 'div':
      return `\\dfrac{${toTex(n.a, sym)}}{${toTex(n.b, sym)}}`
    case 'pow': {
      const e = toTex(n.b, sym)
      if (n.a.t === 'fn' && n.a.name !== 'sqrt') {
        return `\\${n.a.name}^{${e}}${fnArgTex(n.a.a, sym)}`
      }
      const base = n.a.t === 'num' || n.a.t === 'sym' ? toTex(n.a, sym) : `\\left(${toTex(n.a, sym)}\\right)`
      return `${base}^{${e}}`
    }
    case 'fn':
      if (n.name === 'sqrt') return `\\sqrt{${toTex(n.a, sym)}}`
      return `\\${n.name}${fnArgTex(n.a, sym)}`
  }
}

function fnArgTex(a: Node, sym: SymTex): string {
  return isSimpleProduct(a) ? ` ${toTex(a, sym)}` : `\\left(${toTex(a, sym)}\\right)`
}
