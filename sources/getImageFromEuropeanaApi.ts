import type { EuropeanaApiResponse } from '../types/europeana.js'
import fetch from 'node-fetch'

/**
 * Attempts to fetch an image URL from Europeana Record API v2 using a public link.
 * Prioritizes `edmIsShownBy`, then falls back to `edmPreview[]`.
 */
export async function getImageFromEuropeanaApi(link: string): Promise<string | undefined> {
  const apiKey = process.env.EUROPEANA_API_KEY
  if (!apiKey)
    return

  const match = link.match(/\/(?:item|record)\/([^/?#]+)/)
  if (!match)
    return

  const recordId = match[1]
  const apiUrl = `https://api.europeana.eu/record/v2/${recordId}.json?wskey=${apiKey}`

  try {
    const res = await fetch(apiUrl)
    if (!res.ok)
      return

    const data = await res.json() as EuropeanaApiResponse

    return (
      data.object?.aggregations?.[0]?.edmIsShownBy
      || data.object?.europeanaAggregation?.edmPreview?.[0]
    )
  }
  catch (err) {
    console.error('❌ Europeana API fetch error:', (err as Error).message)
    return undefined
  }
}
