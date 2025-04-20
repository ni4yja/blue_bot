import { extractEuropeanaIds } from '../utils/extract.js'
import { fetchFromHtml } from './html.js'
import { fetchFromEuropeanaV2Api } from './v2.js'
import { fetchFromEuropeanaV3Api } from './v3.js'

export interface OgMetadata {
  image?: string
  title?: string
  description?: string
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
