// Run: node scripts/validate-content.cjs
// Checks content JSON before deploying; no third-party packages required.
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const apps = ['kakao', 'browser', 'calls', 'instagram', 'messages', 'notes', 'photos']
const errors = []
const warnings = []
const all = {}
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const checkUnique = (items, location, idField = 'id') => {
  const seen = new Set()
  for (const [i, item] of items.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${location}[${i}] must be an object`)
      continue
    }
    if (typeof item[idField] !== 'string' || !item[idField].trim()) {
      errors.push(`${location}[${i}] missing nonempty id`)
    } else if (seen.has(item[idField])) {
      errors.push(`${location}: duplicate id "${item.id}"`)
    } else seen.add(item[idField])
  }
}
for (const app of apps) {
  all[app] = {}
  const dir = path.join(root, 'content', app)
  for (const file of fs.readdirSync(dir).filter(n => n.endsWith('.json'))) {
    const label = `content/${app}/${file}`
    let data
    try { data = read(path.join(dir, file)) }
    catch (e) { errors.push(`${label}: invalid JSON: ${e.message}`); continue }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push(`${label}: expected object at root`); continue
    }
    all[app][file.replace(/\.json$/, '')] = data
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        if (key !== 'browserHistory') checkUnique(value, `${label}.${key}`, key === 'kakaoProfiles' ? 'contactId' : 'id')
        if (key === 'kakaoRooms') {
          for (const room of value) {
            if (!Array.isArray(room.messages)) errors.push(`${label}: room ${room.id} missing messages array`)
            else checkUnique(room.messages, `${label}.room(${room.id}).messages`)
          }
        }
      }
    }
    // Detect accidental double basePath, double slashes and unsafe absolute paths.
    const walk = (value, key = '') => {
      if (Array.isArray(value)) return value.forEach(v => walk(v, key))
      if (value && typeof value === 'object') return Object.entries(value).forEach(([k,v]) => walk(v,k))
      if (typeof value !== 'string') return
      if (/\/sunjay-phone\/\//.test(value) && /\/sunjay-phone\/\//.test(value.slice(value.indexOf('/sunjay-phone/') + 14))) {
        errors.push(`${label}: repeated basePath in ${key}`)
      }
      if (/\/sunjay-phone\/\//.test(value)) warnings.push(`${label}: double slash in image path (${key})`)
    }
    walk(data)
  }
}
const contactsFile = fs.readFileSync(path.join(root, 'content/common/contacts.ts'), 'utf8')
const contactIds = new Set([...contactsFile.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map(m => m[1]))
for (const [episode, data] of Object.entries(all.kakao)) {
  for (const room of data.kakaoRooms || []) {
    for (const id of room.memberIds || []) {
      if (!contactIds.has(id) && !['me', 'user', 'sunwoo'].includes(id)) {
        warnings.push(`kakao/${episode}: room ${room.id} references unknown contact ${id}`)
      }
    }
  }
}
const episodeIds = fs.readdirSync(path.join(root, 'content/episodes')).filter(n => /^ep\d+\.ts$/.test(n)).map(n => n.slice(0,-3))
for (const app of apps) for (const ep of ['all', ...episodeIds]) {
  if (!all[app][ep]) errors.push(`Missing content/${app}/${ep}.json`)
}
console.log(`Validated ${apps.length} apps / ${episodeIds.length} episodes.`)
for (const warning of [...new Set(warnings)]) console.warn('WARN:', warning)
for (const error of errors) console.error('ERROR:', error)
if (errors.length) process.exitCode = 1
else console.log('No blocking content errors.')
