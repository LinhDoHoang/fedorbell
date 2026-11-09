#!/usr/bin/env node
// CLI used by the fedorbell skills.
//   fedorbell.mjs themes                 list themes
//   fedorbell.mjs show                   print current config
//   fedorbell.mjs theme <name>           set theme
//   fedorbell.mjs set <key> <value>      set diagrams|density|diagramHints
//   fedorbell.mjs chart <spec.json> <out.html> [theme]
//   fedorbell.mjs snippets <spec.json> <out.html> [theme]
import fs from 'node:fs'
import { loadConfig, loadThemes, renderChart, renderSnippets, resolveTheme, saveConfig } from './lib.mjs'

const OPTIONS = {
  diagrams: ['mermaid', 'figure', 'both'],
  density: ['compact', 'rich'],
  diagramHints: ['true', 'false'],
}

export function main(argv) {
  const [cmd, ...args] = argv
  const themes = loadThemes()
  switch (cmd) {
    case 'themes':
      return Object.keys(themes).join('\n')
    case 'show':
      return JSON.stringify(loadConfig(), null, 2)
    case 'theme': {
      if (!themes[args[0]]) throw new Error(`unknown theme "${args[0]}". Available: ${Object.keys(themes).join(', ')}`)
      saveConfig({ theme: args[0] })
      return `theme set to ${args[0]}`
    }
    case 'set': {
      const [key, value] = args
      if (!OPTIONS[key]) throw new Error(`unknown option "${key}". Available: ${Object.keys(OPTIONS).join(', ')}`)
      if (!OPTIONS[key].includes(value)) throw new Error(`${key} must be one of: ${OPTIONS[key].join(', ')}`)
      saveConfig({ [key]: key === 'diagramHints' ? value === 'true' : value })
      return `${key} set to ${value}`
    }
    case 'chart': {
      const [specFile, outFile, theme] = args
      if (!specFile || !outFile) throw new Error('usage: chart <spec.json> <out.html> [theme]')
      const spec = JSON.parse(fs.readFileSync(specFile, 'utf8').replace(/^\uFEFF/, ''))
      fs.writeFileSync(outFile, renderChart(spec, resolveTheme(theme || loadConfig().theme, themes)))
      return `wrote ${outFile}`
    }
    case 'snippets': {
      const [specFile, outFile, theme] = args
      if (!specFile || !outFile) throw new Error('usage: snippets <spec.json> <out.html> [theme]')
      const spec = JSON.parse(fs.readFileSync(specFile, 'utf8').replace(/^\uFEFF/, ''))
      fs.writeFileSync(outFile, renderSnippets(spec, resolveTheme(theme || loadConfig().theme, themes)))
      return `wrote ${outFile}`
    }
    default:
      throw new Error('commands: themes | show | theme <name> | set <key> <value> | chart <spec.json> <out.html> [theme] | snippets <spec.json> <out.html> [theme]')
  }
}

import { fileURLToPath } from 'node:url'
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  try {
    console.log(main(process.argv.slice(2)))
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exit(1)
  }
}
