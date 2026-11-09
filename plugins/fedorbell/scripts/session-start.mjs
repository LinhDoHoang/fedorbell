import { sessionStartPayload } from './lib.mjs'

let out
try {
  out = sessionStartPayload()
} catch {
  out = {}
}
process.stdout.write(JSON.stringify(out))
