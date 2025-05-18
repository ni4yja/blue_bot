import { extractEuropeanaIds } from '../utils/extract.js'
import { fetchFromEuropeanaV3Api } from './v3.js'

export interface OgMetadata {
  image?: string
  title?: string
  description?: string
}

/**
 * Retrieves Open Graph-style metadata using Europeana API v3.
 */
export async function getOgMetadata(link: string): Promise<OgMetadata> {
  const apiKey = process.env.EUROPEANA_API_KEY
  const ids = extractEuropeanaIds(link)

  if (!apiKey || !ids)
    return {}

  return await fetchFromEuropeanaV3Api(ids.datasetId, ids.recordId, apiKey)
}
