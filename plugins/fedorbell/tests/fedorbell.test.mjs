import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-'))
process.env.FEDORBELL_CONFIG = path.join(tmp, 'config.json')
const lib = await import('../scripts/lib.mjs')
const { main } = await import('../scripts/fedorbell.mjs')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('every theme has 6 hex colors and all markers', () => {
  const themes = lib.loadThemes()
  assert.ok(Object.keys(themes).length >= 13)
  for (const [name, t] of Object.entries(themes)) {
    assert.equal(t.palette.length, 6, name)
    for (const c of t.palette) assert.match(c, /^#[0-9a-f]{6}$/i, name)
    for (const k of ['ok', 'warn', 'error', 'info', 'bullet']) assert.ok(t.markers[k], `${name}.${k}`)
  }
})

test('config defaults, theme persistence, validation', () => {
  assert.equal(lib.loadConfig().theme, 'mono')
  main(['theme', 'nord'])
  assert.equal(lib.loadConfig().theme, 'nord')
  assert.throws(() => main(['theme', 'nope']), /unknown theme/)
  main(['set', 'density', 'compact'])
  assert.equal(lib.loadConfig().density, 'compact')
  main(['set', 'diagramHints', 'false'])
  assert.equal(lib.loadConfig().diagramHints, false)
  assert.throws(() => main(['set', 'density', 'huge']), /must be one of/)
  assert.throws(() => main(['set', 'bogus', 'x']), /unknown option/)
})

test('unknown theme falls back to mono', () => {
  assert.equal(lib.resolveTheme('zzz'), 'mono')
})

test('bar, line and pie charts render with theme colors', () => {
  const base = { title: 'T <b>', labels: ['a', 'b', 'c'], series: [{ name: 'x', values: [1, 5, 3] }] }
  const first = lib.loadThemes().dracula.palette[0]
  for (const type of ['bar', 'line', 'pie']) {
    const html = lib.renderChart({ ...base, type }, 'dracula')
    assert.ok(html.includes('<svg'), type)
    assert.ok(html.includes(first), type)
    assert.ok(html.includes('T &lt;b&gt;'), 'title escaped')
    assert.ok(!html.includes('NaN'), type)
  }
})

test('chart handles negatives and all-zero pie', () => {
  const neg = lib.renderChart({ type: 'bar', labels: ['a', 'b'], series: [{ name: 's', values: [-2, 4] }] }, 'nord')
  assert.ok(!neg.includes('NaN'))
  const zero = lib.renderChart({ type: 'pie', labels: ['a'], series: [{ name: 's', values: [0] }] }, 'nord')
  assert.ok(!zero.includes('NaN'))
})

test('cleanData gives plain TSV and markdown without chart decoration', () => {
  const spec = { type: 'bar', title: 'T', labels: ['a|b', 'c'], series: [{ name: 'x', values: [1, 2.5] }, { name: 'y\tz', values: [3, 4] }] }
  const { tsv, markdown } = lib.cleanData(spec)
  assert.equal(tsv, 'label\tx\ty z\na|b\t1\t3\nc\t2.5\t4')
  assert.equal(markdown, '| label | x | y z |\n| --- | --- | --- |\n| a\\|b | 1 | 3 |\n| c | 2.5 | 4 |')
  assert.ok(!/<|T$/m.test(tsv))
  const pie = lib.cleanData({ type: 'pie', labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }, { name: 'ignored', values: [9, 9] }] })
  assert.equal(pie.tsv, 'label\ts\na\t1\nb\t2')
})

test('chart html has copy-on-select, copy buttons and a valid inline script', () => {
  const html = lib.renderChart({ type: 'bar', title: '</script><b>', labels: ['a'], series: [{ name: 's', values: [1] }] }, 'nord')
  assert.ok(html.includes('data-copy="tsv"') && html.includes('data-copy="markdown"'))
  assert.ok(html.includes('mouseup'))
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  assert.equal(scripts.length, 1)
  new vm.Script(scripts[0])
  assert.ok(!html.includes('</script><b>'), 'title cannot close the script tag')
})

test('invalid chart specs are rejected', () => {
  assert.throws(() => lib.validateSpec({ type: 'radar', labels: ['a'], series: [{ values: [1] }] }), /type/)
  assert.throws(() => lib.validateSpec({ type: 'bar', labels: ['a', 'b'], series: [{ name: 's', values: [1] }] }), /needs 2 values/)
  assert.throws(() => lib.validateSpec({ type: 'pie', labels: ['a'], series: [{ name: 's', values: [-1] }] }), />= 0/)
})

test('chart CLI writes a file', () => {
  const spec = path.join(tmp, 's.json')
  const out = path.join(tmp, 'o.html')
  fs.writeFileSync(spec, JSON.stringify({ type: 'line', labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] }))
  main(['chart', spec, out, 'gruvbox'])
  assert.ok(fs.readFileSync(out, 'utf8').includes('<polyline'))
})

test('SessionStart hook prints valid inject payload with user_markdown', () => {
  const stdout = execFileSync('node', [path.join(root, 'scripts', 'session-start.mjs')], {
    env: { ...process.env, FEDORBELL_CONFIG: path.join(tmp, 'config.json') },
  }).toString()
  const p = JSON.parse(stdout)
  const sm = p.injectSteps[0].systemMessage
  assert.match(sm.systemMessage, /Theme: nord/)
  assert.match(sm.metadata.user_markdown, /nord/)
  assert.ok(!/chart skill/.test(sm.systemMessage), 'hints off after diagramHints=false')
})

test('hooks.json matches the agy contract', () => {
  const h = JSON.parse(fs.readFileSync(path.join(root, 'hooks.json'), 'utf8'))
  const e = h.fedorbell.SessionStart[0]
  assert.equal(e.type, 'command')
  assert.ok(fs.existsSync(path.join(root, e.command.replace('node ./', ''))))
})

test('copy cards: exact text per item, escaped display, valid script, "Copy all"', () => {
  const spec = {
    title: 'Next steps',
    items: [
      { label: 'Install', lang: 'bash', text: 'npm i <pkg> && echo "</script>"' },
      { label: 'Prompt', text: 'Refactor this:\n  keep indentation' },
    ],
  }
  const html = lib.renderSnippets(spec, 'dracula')
  assert.ok(html.includes('data-copy="0"') && html.includes('data-copy="1"') && html.includes('data-copy="all"'))
  assert.ok(html.includes('npm i &lt;pkg&gt; &amp;&amp; echo'), 'display is escaped')
  assert.ok(!html.includes('</script>"'), 'text cannot close the script tag')
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  assert.equal(code.length, 1)
  const data = JSON.parse(code[0].match(/const data = (.*);\n/)[1])
  assert.equal(data['0'], 'npm i <pkg> && echo "</script>"')
  assert.equal(data['1'], 'Refactor this:\n  keep indentation')
  assert.equal(data.all, `${data['0']}\n\n${data['1']}`)
  assert.ok(!lib.renderSnippets({ items: [{ text: 'x' }] }, 'nord').includes('data-copy="all"'), 'no Copy all for one item')
})

test('invalid snippet specs are rejected', () => {
  assert.throws(() => lib.renderSnippets({ items: [] }, 'nord'), /items/)
  assert.throws(() => lib.renderSnippets({ items: [{ text: '' }] }, 'nord'), /text/)
  assert.throws(() => lib.renderSnippets({}, 'nord'), /items/)
})

test('snippets CLI writes a file', () => {
  const spec = path.join(tmp, 'sn.json')
  const out = path.join(tmp, 'sn.html')
  fs.writeFileSync(spec, JSON.stringify({ items: [{ label: 'a', text: 'ls' }] }))
  main(['snippets', spec, out])
  assert.ok(fs.readFileSync(out, 'utf8').includes('data-copy="0"'))
})
