import { load } from 'cheerio'
import * as dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const EUROPEANA_API_KEY = process.env.EUROPEANA_API_KEY || ''

interface EuropeanaAggregation {
  edmIsShownBy?: string
  edmPreview?: string
}

interface EuropeanaItem {
  aggregations: EuropeanaAggregation[]
}

interface EuropeanaApiResponse {
  success: boolean
  object?: EuropeanaItem
  error?: string
}

interface OgMetadata {
  image?: string
  title?: string
  description?: string
}

function parseEuropeanaId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('europeana.eu') && urlObj.pathname.startsWith('/item/')) {
      return urlObj.pathname.replace('/item/', '')
    }
    return null
  }
  catch (error) {
    console.error('Error fetching OG metadata:', error)
    return null
  }
}

async function fetchEuropeanaImage(recordId: string): Promise<string | null> {
  if (!EUROPEANA_API_KEY)
    return null

  try {
    const apiUrl = `https://api.europeana.eu/record/${recordId}.json?wskey=${EUROPEANA_API_KEY}`
    const response = await fetch(apiUrl)
    if (!response.ok)
      throw new Error('Unexpected error occurred')

    const data = await response.json() as EuropeanaApiResponse
    const aggregation = data?.object?.aggregations?.[0]
    return aggregation?.edmIsShownBy || aggregation?.edmPreview || null
  }
  catch (error) {
    console.error('Error fetching OG metadata:', error)
    return null
  }
}

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; BlueBot/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': 'https://www.google.com/',
  'Cache-Control': 'no-cache',
}

async function tryFetchMetadata(url: string): Promise<OgMetadata> {
  try {
    const res = await fetch(url, { headers })
    if (!res.ok)
      throw new Error('Unexpected error occurred')
    const html = await res.text()
    const $ = load(html)

    const image = $('meta[property="og:image"]').attr('content') || undefined
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || undefined
    const description = $('meta[property="og:description"]').attr('content') || undefined

    return { image, title, description }
  }
  catch (error) {
    console.error('Error fetching OG metadata:', error)
    return {}
  }
}

export async function getOgMetadata(link: string): Promise<OgMetadata> {
  const europeanaId = parseEuropeanaId(link)
  if (europeanaId) {
    const image = await fetchEuropeanaImage(europeanaId)
    return image ? { image } : {}
  }

  const metadata = await tryFetchMetadata(link)
  if (!metadata.image && link.startsWith('http:')) {
    const httpsLink = link.replace('http:', 'https:')
    return await tryFetchMetadata(httpsLink)
  }

  return metadata
}
