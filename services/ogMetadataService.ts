import type { EuropeanaApiResponse } from './types/europeana.ts'
import { load } from 'cheerio'
import fetch from 'node-fetch'

export interface OgMetadata {
  image?: string
  title?: string
  description?: string
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; BlueBot/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': 'https://www.google.com/',
  'Cache-Control': 'no-cache',
}

function extractEuropeanaIds(url: string): { datasetId: string, recordId: string } | null {
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

function extractLocalizedField(field?: Record<string, string[]>, preferredLang = 'en'): string | undefined {
  if (!field)
    return undefined
  if (field[preferredLang]?.length)
    return field[preferredLang][0]
  const fallback = Object.values(field)[0]
  return fallback?.[0]
}

function extractDescriptionFromArray(
  descriptions?: Array<{ value: string, lang?: string }>,
  preferredLang = 'en',
): string | undefined {
  if (!descriptions)
    return undefined
  const preferred = descriptions.find(d => d.lang === preferredLang)
  return preferred?.value || descriptions[0]?.value
}

interface EuropeanaV3Proxy {
  id?: string
  title?: Record<string, string[]>
  description?: Array<{ value: string, lang?: string }>
  edmPreview?: string
  edmIsShownBy?: string
  edmObject?: string
}

interface EuropeanaV3Response {
  thumbnail?: string
  proxies?: EuropeanaV3Proxy[]
}

async function fetchFromEuropeanaV3Api(datasetId: string, recordId: string): Promise<OgMetadata> {
  const url = `${process.env.EUROPEANA_API_URL_V3}/record/v3/${datasetId}/${recordId}?profile=meta.full,media.full`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`❌ Europeana V3 API failed. Status: ${res.status}`)
      return {}
    }

    const data: EuropeanaV3Response = await res.json()
    const providerProxy = data.proxies?.find(p =>
      p.id?.includes('/proxy/provider/'),
    )

    const title = extractLocalizedField(providerProxy?.title, 'en')
      || Object.values(providerProxy?.title || {})[0]?.[0]
    const description = extractDescriptionFromArray(providerProxy?.description, 'en')
    const image = providerProxy?.edmIsShownBy || providerProxy?.edmObject || providerProxy?.edmPreview || data.thumbnail

    return { image, title, description }
  }
  catch (error) {
    console.error('❌ Error fetching Europeana v3 metadata:', error)
    return {}
  }
}

async function fetchFromEuropeanaV2Api(datasetId: string, recordId: string, apiKey: string): Promise<OgMetadata> {
  const apiUrl = `https://api.europeana.eu/record/v2/${datasetId}/${recordId}.json?wskey=${apiKey}`

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) {
      console.error(`❌ Europeana V2 API request failed. Status: ${res.status}`)
      return {}
    }

    const data = await res.json() as EuropeanaApiResponse

    const image = data.object?.europeanaAggregation?.edmPreview
      ?? data.object?.aggregations?.[0]?.edmIsShownBy
      ?? data.object?.aggregations?.[0]?.edmPreview

    const title = data.object?.providedCHOs?.[0]?.dcTitle?.[0]
    const description = data.object?.providedCHOs?.[0]?.dcDescription?.[0]

    return { image, title, description }
  }
  catch (error) {
    console.error('❌ Error fetching Europeana v2 metadata:', error)
    return {}
  }
}

async function fetchFromHtml(link: string): Promise<OgMetadata> {
  try {
    const res = await fetch(link, { headers: HEADERS })
    if (!res.ok) {
      console.error(`❌ Failed to fetch page. Status: ${res.status}`)
      return {}
    }

    const html = await res.text()
    const $ = load(html)

    const image = $('meta[property="og:image"]').attr('content') || undefined
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || undefined
    const description = $('meta[property="og:description"]').attr('content') || undefined

    return { image, title, description }
  }
  catch (error) {
    console.error('⚠️ Error parsing OG metadata:', error)
    return {}
  }
}

export async function getOgMetadata(link: string): Promise<OgMetadata> {
  const europeanaApiKey = process.env.EUROPEANA_API_KEY
  const useV3 = process.env.USE_V3_API
  const ids = extractEuropeanaIds(link)

  if (ids) {
    if (useV3) {
      return await fetchFromEuropeanaV3Api(ids.datasetId, ids.recordId)
    }
    else if (europeanaApiKey) {
      return await fetchFromEuropeanaV2Api(ids.datasetId, ids.recordId, europeanaApiKey)
    }
  }

  return await fetchFromHtml(link)
}
