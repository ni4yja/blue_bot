import fetch from 'node-fetch'

export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; BlueBot/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': 'https://www.google.com/',
  'Cache-Control': 'no-cache',
}

export function extractEuropeanaIds(url: string): { datasetId: string, recordId: string } | null {
  try {
    const { hostname, pathname } = new URL(url)
    const parts = pathname.split('/').filter(Boolean)

    if (hostname.includes('europeana.eu') && parts[0] === 'item' && parts.length >= 3) {
      const [, datasetId, ...rest] = parts
      const recordId = rest.join('/')
      return { datasetId, recordId }
    }

    return null
  }
  catch (error) {
    console.error('❌ Failed to parse Europeana URL:', error)
    return null
  }
}

export function extractMultilangValue<T extends string | string[]>(
  input?: Record<string, T> | Array<{ '@value': string, '@language'?: string }>,
  preferredLang = 'en',
): string | undefined {
  if (!input)
    return undefined

  if (Array.isArray(input)) {
    const preferred = input.find(el => el['@language'] === preferredLang)
    return preferred?.['@value'] || input[0]?.['@value']
  }

  const raw = input[preferredLang] || Object.values(input)[0]
  return Array.isArray(raw) ? raw[0] : raw
}

export async function resolveThumbnail(url?: string): Promise<string | undefined> {
  if (!url || !url.includes('thumbnail/v2/url.json'))
    return url

  try {
    const res = await fetch(url)
    if (!res.ok)
      return undefined

    const data = (await res.json()) as { thumbnail?: string }
    return data.thumbnail || undefined
  }
  catch (err) {
    console.error('❌ Error resolving thumbnail:', err)
    return undefined
  }
}
