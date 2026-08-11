/**
 * The generator bakes the spec's `servers[0].url` into `runtime.ts`, pinning the
 * client to whichever host produced the spec (localhost:8080, :8099, a staging
 * box...). The app decides its own base URL in `src/api/client.ts`, so blank the
 * baked-in one after every generation.
 */
import { readFile, writeFile } from "node:fs/promises"

const file = "src/api/generated/runtime.ts"
const source = await readFile(file, "utf8")
const patched = source.replace(/export const BASE_PATH = "[^"]*"/, 'export const BASE_PATH = ""')

if (patched === source) {
  console.error(`clear-base-path: BASE_PATH assignment not found in ${file}`)
  process.exit(1)
}

await writeFile(file, patched)
console.log("clear-base-path: BASE_PATH cleared")
