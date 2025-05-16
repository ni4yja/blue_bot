import type { EuropeanaV2Response } from '../types/europeana.js'
import fetch from 'node-fetch'

/**
 * Retrieves a resized thumbnail from Europeana Thumbnail API v2.
 * Returns either the `original` or `thumbnail` image, or undefined on failure.
 */
export async function getEuropeanaThumbnailFromV2(imageUrl: string): Promise<string | undefined> {
  try {
    const encodedUrl = encodeURIComponent(imageUrl)
    const apiUrl = `https://api.europeana.eu/thumbnail/v2/url.json?url=${encodedUrl}&size=w400&type=IMAGE`

    const res = await fetch(apiUrl)
    if (!res.ok)
      return

    const data = await res.json() as EuropeanaV2Response

    if (data.default === false && data.original)
      return data.original
    if (data.thumbnail)
      return data.thumbnail

    return undefined
  }
  catch (error) {
    console.error('❌ Europeana v2 thumbnail fetch failed:', (error as Error).message)
    return undefined
  }
}
