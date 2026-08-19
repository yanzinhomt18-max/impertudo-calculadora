import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const distPath = fileURLToPath(new URL('../dist/', import.meta.url))

async function walk(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    const relative = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolute, relative))
    else files.push(relative)
  }
  return files
}

const files = (await walk(distPath))
  .filter((file) => file !== 'sw.js' && file !== 'precache.json' && !file.endsWith('.map'))
  .sort()

const urls = files.map((file) => file === 'index.html' ? '/' : `/${file}`)
const signature = createHash('sha256').update(urls.join('\n')).digest('hex').slice(0, 12)

await fs.writeFile(path.join(distPath, 'precache.json'), JSON.stringify({ version: signature, urls }, null, 2))

const swPath = path.join(distPath, 'sw.js')
const sw = await fs.readFile(swPath, 'utf8')
if (!sw.includes('__BUILD_ID__')) throw new Error('Placeholder __BUILD_ID__ não encontrado em dist/sw.js')
await fs.writeFile(swPath, sw.replaceAll('__BUILD_ID__', signature))

console.log(`Precache V9 gerado: ${urls.length} arquivo(s), build ${signature}.`)
