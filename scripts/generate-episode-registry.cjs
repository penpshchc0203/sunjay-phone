// Run: node scripts/generate-episode-registry.cjs
// Regenerates static imports needed by Next.js from content/<app>/epNN.json.
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const apps = ['kakao', 'browser', 'calls', 'instagram', 'messages', 'notes', 'photos']
const episodeFiles = fs.readdirSync(path.join(root, 'content', 'episodes'))
  .filter(n => /^ep\d+\.ts$/.test(n)).sort()
const ids = episodeFiles.map(n => n.slice(0, -3))
for (const app of apps) {
  for (const id of ['all', ...ids]) {
    if (!fs.existsSync(path.join(root, 'content', app, id + '.json'))) {
      throw Error(`Missing: content/${app}/${id}.json`)
    }
  }
}
const target = path.join(root, 'content', 'episodes', 'load-content.ts')
let loader = fs.readFileSync(target, 'utf8')
const imports = apps.flatMap(app => ['all', ...ids].map(id =>
  `import ${app}_${id} from '../${app}/${id}.json'`)).join('\n')
const registry = 'const sources: Record<string, Record<string, Dataset>> = {\n' +
  apps.map(app => `  ${app}: {${['all', ...ids].map(id => `${id}: ${app}_${id}`).join(', ')}},`).join('\n') +
  '\n}'
loader = loader.replace(/import kakao_all from '\.\.\/kakao\/all\.json'[\s\S]*?(?=type Row =)/, imports + '\n')
loader = loader.replace(/const sources: Record<string, Record<string, Dataset>> = \{[\s\S]*?\n\}/, registry)
loader = loader.replace(/episodeId: 'ep01'\|'ep02'\|'ep03'/, 'episodeId: string')
loader = loader.replace(/const currentContacts = [^\n]+/, `const currentContacts = episodeId === 'ep01' ? contacts : episodeId === 'ep02' ? contactsEp02 : contactsEp03`)
fs.writeFileSync(target, loader)
const episodeIndex = [
  ...ids.map(id => `import { ${id} } from './${id}'`),
  "export type { Episode, EpisodeContent } from './types'",
  '/** Add an epNN.ts and matching JSON files, then run the generator. */',
  `export const EPISODES = [${ids.join(', ')}]`,
  `export const DEFAULT_EPISODE_ID = '${ids[0]}'`,
  ''
].join('\n')
fs.writeFileSync(path.join(root, 'content', 'episodes', 'index.ts'), episodeIndex)
console.log('Generated episode registry for:', ids.join(', '))
