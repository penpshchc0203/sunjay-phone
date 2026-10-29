/** GitHub Pages basePath. Keep it in one place. */
export const ASSET_BASE_PATH = '/sunjay-phone'

/** Accepts /images/..., images/..., or already-prefixed paths. */
export function assetPath(path: string): string {
  if (!path || /^(?:https?:|data:|blob:)/i.test(path)) return path
  const normalized = '/' + path.replace(/^\/+/, '').replace(/\/+/g, '/')
  const prefix = ASSET_BASE_PATH + '/'
  if (normalized === ASSET_BASE_PATH) return normalized
  if (normalized.startsWith(prefix)) {
    return prefix + normalized.slice(prefix.length).replace(/^\/+/, '')
  }
  return prefix + normalized.replace(/^\/+/, '')
}
