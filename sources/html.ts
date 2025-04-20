import type { OgMetadata } from './getOgMetadata.ts'
import { load } from 'cheerio'
import fetch from 'node-fetch'
import { HEADERS } from '../utils/extract.js'

export async function fetchFromHtml(link: string): Promise<OgMetadata> {
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
    const description = $('meta[property="og:description"]').attr('content') || 'No description available.'

    return { image, title, description }
  }
  catch (error) {
    console.error('⚠️ Error parsing OG metadata:', error)
    return {}
  }
}
