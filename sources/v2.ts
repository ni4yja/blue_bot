import type { EuropeanaApiResponse } from '../types/europeana.ts'
import type { OgMetadata } from './getOgMetadata.ts'
import fetch from 'node-fetch'

export async function fetchFromEuropeanaV2Api(datasetId: string, recordId: string, apiKey: string): Promise<OgMetadata> {
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
    const description = data.object?.providedCHOs?.[0]?.dcDescription?.[0] || 'No description available.'

    return { image, title, description }
  }
  catch (error) {
    console.error('❌ Error fetching Europeana v2 metadata:', error)
    return {}
  }
}
