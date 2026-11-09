import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const PLUGIN_ROOT = process.env.PLUGIN_ROOT || path.resolve(here, '..')
export const DEFAULT_THEME = 'mono'
export const DEFAULTS = { theme: DEFAULT_THEME, diagrams: 'both', density: 'rich', diagramHints: true }

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))

export function loadThemes() {
  return readJson(path.join(PLUGIN_ROOT, 'themes.json'))
}

export function configPath() {
  if (process.env.FEDORBELL_CONFIG) return process.env.FEDORBELL_CONFIG
  // Not PLUGIN_DATA: the hook gets it but the CLI the agent runs via a shell does not, and both must share one file.
  return path.join(os.homedir(), '.gemini', 'fedorbell', 'config.json')
}

export function loadConfig() {
  try {
    return { ...DEFAULTS, ...readJson(configPath()) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveConfig(patch) {
  const next = { ...loadConfig(), ...patch }
  const file = configPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n')
  return next
}

export function resolveTheme(name, themes = loadThemes()) {
  return themes[name] ? name : DEFAULT_THEME
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''))

export function validateSpec(spec) {
  if (!spec || !['bar', 'line', 'pie'].includes(spec.type)) throw new Error('type must be bar, line or pie')
  if (!Array.isArray(spec.labels) || spec.labels.length === 0) throw new Error('labels must be a non-empty array')
  if (!Array.isArray(spec.series) || spec.series.length === 0) throw new Error('series must be a non-empty array')
  for (const s of spec.series) {
    if (!Array.isArray(s.values) || s.values.length !== spec.labels.length) throw new Error(`series "${s.name}" needs ${spec.labels.length} values`)
    if (s.values.some((v) => typeof v !== 'number' || !Number.isFinite(v))) throw new Error(`series "${s.name}" has a non-numeric value`)
  }
  if (spec.type === 'pie' && spec.series[0].values.some((v) => v < 0)) throw new Error('pie values must be >= 0')
}

const W = 520
const H = 240
const PAD = { l: 44, r: 12, t: 12, b: 28 }

function niceMax(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v)
}

function cartesian(spec, colors) {
  const all = spec.series.flatMap((s) => s.values)
  const max = niceMax(Math.max(...all, 0))
  const min = Math.min(...all, 0)
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const y = (v) => PAD.t + ih - ((v - min) / (max - min)) * ih
  const n = spec.labels.length
  let g = ''
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4
    g += `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)" stroke-width="1"/>`
    g += `<text x="${PAD.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="var(--muted-foreground)">${fmt(v)}</text>`
  }
  const slot = iw / n
  spec.labels.forEach((l, i) => {
    g += `<text x="${PAD.l + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--muted-foreground)">${esc(l)}</text>`
  })
  if (spec.type === 'bar') {
    const k = spec.series.length
    const bw = (slot * 0.7) / k
    spec.series.forEach((s, si) => {
      s.values.forEach((v, i) => {
        const x = PAD.l + slot * i + slot * 0.15 + bw * si
        g += `<rect x="${x}" y="${Math.min(y(v), y(0))}" width="${bw}" height="${Math.abs(y(v) - y(0))}" rx="3" fill="${colors[si % colors.length]}"><title>${esc(s.name)} ${esc(spec.labels[i])}: ${fmt(v)}</title></rect>`
      })
    })
  } else {
    spec.series.forEach((s, si) => {
      const pts = s.values.map((v, i) => [PAD.l + slot * i + slot / 2, y(v)])
      const c = colors[si % colors.length]
      g += `<polyline fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p) => p.join(',')).join(' ')}"/>`
      pts.forEach((p, i) => (g += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${c}"><title>${esc(s.name)} ${esc(spec.labels[i])}: ${fmt(s.values[i])}</title></circle>`))
    })
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full" role="img" aria-label="${esc(spec.title || spec.type + ' chart')}">${g}</svg>`
}

function pie(spec, colors) {
  const vals = spec.series[0].values
  const total = vals.reduce((a, b) => a + b, 0)
  const cx = 120
  const cy = 110
  const r = 90
  let a0 = -Math.PI / 2
  let g = ''
  vals.forEach((v, i) => {
    if (total === 0 || v === 0) return
    const c = colors[i % colors.length]
    const title = `<title>${esc(spec.labels[i])}: ${fmt(v)} (${((v / total) * 100).toFixed(1)}%)</title>`
    if (v === total) {
      g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}">${title}</circle>`
      return
    }
    const a1 = a0 + (v / total) * Math.PI * 2
    const [x0, y0, x1, y1] = [cx + r * Math.cos(a0), cy + r * Math.sin(a0), cx + r * Math.cos(a1), cy + r * Math.sin(a1)]
    g += `<path d="M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z" fill="${c}">${title}</path>`
    a0 = a1
  })
  return { g, total }
}

/** Plain data of a chart: no title, legend, colors or markup. Pie uses the first series only. */
export function cleanData(spec) {
  const series = spec.type === 'pie' ? spec.series.slice(0, 1) : spec.series
  const cell = (s) => String(s).replace(/[\t\r\n]+/g, ' ')
  const rows = [['label', ...series.map((s) => cell(s.name ?? 'value'))], ...spec.labels.map((l, i) => [cell(l), ...series.map((s) => String(s.values[i]))])]
  const md = (s) => s.replace(/\|/g, '\\|')
  return {
    tsv: rows.map((r) => r.join('\t')).join('\n'),
    markdown: [`| ${rows[0].map(md).join(' | ')} |`, `| ${rows[0].map(() => '---').join(' | ')} |`, ...rows.slice(1).map((r) => `| ${r.map(md).join(' | ')} |`)].join('\n'),
  }
}

// Runs inside the widget iframe: copy the selection on mouseup, and copy clean data from the buttons.
const COPY_SCRIPT = `
const data = __DATA__;
const toast = document.getElementById('pm-toast');
function say(m) { toast.textContent = m; toast.style.opacity = 1; clearTimeout(say.t); say.t = setTimeout(() => { toast.style.opacity = 0 }, 1400) }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true } catch {}
  const t = document.createElement('textarea');
  t.value = text; t.style.position = 'fixed'; t.style.opacity = 0;
  document.body.appendChild(t); t.select();
  let ok = false;
  try { ok = document.execCommand('copy') } catch {}
  t.remove();
  return ok;
}
document.addEventListener('mouseup', () => setTimeout(async () => {
  const s = String(window.getSelection()).trim();
  if (s) say((await copy(s)) ? 'Copied selection' : 'Copy failed');
}, 0));
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  say((await copy(data[b.dataset.copy])) ? 'Copied ' + b.dataset.copy : 'Copy failed');
}));
`

export function renderChart(spec, themeName) {
  validateSpec(spec)
  const themes = loadThemes()
  const colors = themes[resolveTheme(themeName, themes)].palette
  let body
  if (spec.type === 'pie') {
    const { g, total } = pie(spec, colors)
    const legend = spec.labels
      .map((l, i) => `<li class="flex items-center gap-2"><span style="background:${colors[i % colors.length]}" class="inline-block w-3 h-3 rounded-sm"></span>${esc(l)} <span class="text-[var(--muted-foreground)]">${total ? ((spec.series[0].values[i] / total) * 100).toFixed(1) : '0.0'}%</span></li>`)
      .join('')
    body = `<div class="flex items-center gap-6"><svg viewBox="0 0 240 220" class="w-56 shrink-0" role="img" aria-label="${esc(spec.title || 'pie chart')}">${g}</svg><ul class="text-sm space-y-1">${legend}</ul></div>`
  } else {
    const legend =
      spec.series.length > 1
        ? `<ul class="flex gap-4 text-sm mb-2">${spec.series.map((s, i) => `<li class="flex items-center gap-2"><span style="background:${colors[i % colors.length]}" class="inline-block w-3 h-3 rounded-sm"></span>${esc(s.name)}</li>`).join('')}</ul>`
        : ''
    body = legend + cartesian(spec, colors)
  }
  const title = spec.title ? `<h2 class="text-[var(--foreground)] font-semibold text-lg mb-3">${esc(spec.title)}</h2>` : ''
  const actions = `<div class="flex items-center gap-2 mt-3 select-none"><button type="button" data-copy="tsv" class="${BTN}">Copy data</button><button type="button" data-copy="markdown" class="${BTN}">Copy as Markdown</button>${TOAST}</div>`
  return page(`${title}${body}${actions}`, cleanData(spec))
}

const BTN = 'px-2 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] select-none'
const TOAST = '<span id="pm-toast" class="text-xs text-[var(--muted-foreground)]" style="opacity:0;transition:opacity .2s"></span>'

/** Shared widget shell: card, Tailwind, and the copy script fed with `data` (key -> exact text to copy). */
function page(inner, data) {
  const script = COPY_SCRIPT.replace('__DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, ' '))
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-5">
<div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
${inner}
</div>
<script>${script}</script>
</body>
</html>
`
}

/** Copy cards for prompts, commands and code the agent suggests. Each card copies its exact text. */
export function renderSnippets(spec, themeName) {
  const items = spec?.items
  if (!Array.isArray(items) || items.length === 0) throw new Error('items must be a non-empty array')
  items.forEach((it, i) => {
    if (typeof it?.text !== 'string' || it.text.trim() === '') throw new Error(`item ${i} needs non-empty text`)
  })
  const themes = loadThemes()
  const accent = themes[resolveTheme(themeName, themes)].palette[0]
  const data = Object.fromEntries(items.map((it, i) => [String(i), it.text]))
  if (items.length > 1) data.all = items.map((it) => it.text).join('\n\n')
  const cards = items
    .map((it, i) => {
      const head = [it.label ? `<span class="text-sm font-medium text-[var(--foreground)]">${esc(it.label)}</span>` : '', it.lang ? `<span class="text-xs text-[var(--muted-foreground)]">${esc(it.lang)}</span>` : ''].join('')
      return `<div class="rounded-lg border border-[var(--border)] mb-3" style="border-left:3px solid ${accent}"><div class="flex items-center justify-between gap-2 px-3 py-2 select-none"><div class="flex items-center gap-2">${head}</div><button type="button" data-copy="${i}" class="${BTN}">Copy</button></div><pre class="px-3 pb-3 text-sm whitespace-pre-wrap break-words" style="font-family:ui-monospace,monospace">${esc(it.text)}</pre></div>`
    })
    .join('')
  const title = spec.title ? `<h2 class="text-[var(--foreground)] font-semibold text-lg mb-3">${esc(spec.title)}</h2>` : ''
  const all = items.length > 1 ? `<button type="button" data-copy="all" class="${BTN}">Copy all</button>` : ''
  return page(`${title}${cards}<div class="flex items-center gap-2 select-none">${all}${TOAST}</div>`, data)
}

export function sessionStartPayload(cfg = loadConfig()) {
  const themes = loadThemes()
  const name = resolveTheme(cfg.theme, themes)
  const m = themes[name].markers
  const lines = [
    `fedorbell is active. Theme: ${name}. Markers: ok ${m.ok}, warn ${m.warn}, error ${m.error}, info ${m.info}, bullet ${m.bullet}.`,
    `Preferences: diagrams=${cfg.diagrams}, density=${cfg.density}.`,
  ]
  if (cfg.diagramHints) {
    lines.push(
      'When a picture explains faster than prose, use a markdown table, a mermaid diagram, or a text figure. For numeric data with 3 or more points, use the fedorbell-chart skill. When you suggest prompts, commands or code for the user to copy, also render them with the fedorbell-copy skill. Put the core answer on the first screen and skip pictures for short answers.',
    )
  }
  return {
    injectSteps: [
      {
        systemMessage: {
          systemMessage: lines.join('\n'),
          metadata: { user_markdown: `**fedorbell** · theme \`${name}\` · diagrams \`${cfg.diagrams}\` · density \`${cfg.density}\`` },
        },
      },
    ],
  }
}
