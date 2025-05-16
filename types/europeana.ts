// Europeana V2 Thumbnail API response
export interface EuropeanaV2Response {
  thumbnail?: string // resized preview URL
  original?: string // original image URL
  default?: boolean // whether thumbnail is default or not
  status?: string // optional status field
}

// Europeana Record API v2 main response
export interface EuropeanaApiResponse {
  object: EuropeanaRecordObject
}

// Core Europeana object structure (v2)
export interface EuropeanaRecordObject {
  europeanaAggregation?: EuropeanaAggregation // general metadata
  aggregations?: EuropeanaAggregation[] // per-provider metadata
  providedCHOs?: ProvidedCHO[] // cultural heritage objects
  edmPreview?: string[] // fallback image previews
  edmIsShownBy?: string // direct image URL (preferred)
  edmIsShownAt?: string // full record page
}

export interface EuropeanaAggregation {
  edmPreview?: string
  edmIsShownBy?: string
  edmIsShownAt?: string
  edmObject?: string
}

export interface ProvidedCHO {
  dcTitle?: string[]
  dcDescription?: string[]
}

// ─────────────────────────────────────────────
// Europeana Record API v3
// ─────────────────────────────────────────────

export interface EuropeanaV3Proxy {
  id?: string
  title?: Record<string, string | string[]>
  description?: Array<{ '@value': string, '@language'?: string }>
  edmPreview?: string
  edmIsShownBy?: string
  edmObject?: string
  proxyIn?: {
    object?: { id?: string }
    isShownBy?: { id?: string }
  }
}

export interface EuropeanaV3Response {
  thumbnail?: string
  proxies?: EuropeanaV3Proxy[]
}
