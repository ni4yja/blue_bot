import type { EuropeanaApiResponse } from '../types/europeana.js'
import fetch from 'node-fetch'

export async function getImageFromEuropeanaApi(link: string): Promise<string | undefined> {
  const apiKey = process.env.EUROPEANA_API_KEY
  if (!apiKey) {
    console.warn('⚠️ No Europeana API key found.')
    return undefined
  }

  try {
    const match = link.match(/\/(?:item|record)\/([^/?#]+)/)
    if (!match) {
      console.warn('⚠️ Unable to extract Europeana record ID from:', link)
      return undefined
    }

    const recordId = match[1]
    const apiUrl = `https://api.europeana.eu/record/v2/${recordId}.json?wskey=${apiKey}`

    console.log('📡 Fetching Europeana API for image:', apiUrl)

    const res = await fetch(apiUrl)
    if (!res.ok) {
      console.warn(`⚠️ Europeana API returned ${res.status}: ${res.statusText}`)
      return undefined
    }

    const data = await res.json() as EuropeanaApiResponse

    // Пробуємо знайти зображення через edmIsShownBy
    const shownBy = data.object?.aggregations?.[0]?.edmIsShownBy
    if (shownBy) {
      console.log('🖼️ Found edmIsShownBy:', shownBy)
      return shownBy
    }

    // Альтернатива: edmPreview[]
    const preview = data.object?.europeanaAggregation?.edmPreview
    if (preview?.length) {
      console.log('🖼️ Using edmPreview fallback:', preview[0])
      return preview[0]
    }

    console.warn('ℹ️ No image found in Europeana API response.')
    return undefined
  }
  catch (err) {
    console.error('❌ Europeana API fetch error:', (err as Error).message)
    return undefined
  }
}
