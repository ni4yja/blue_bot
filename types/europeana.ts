export interface EuropeanaApiResponse {
  object: EuropeanaRecordObject
}

export interface EuropeanaV2Response {
  thumbnail?: string
  original?: string
  default?: boolean
  status?: string
}

export interface EuropeanaRecordObject {
  europeanaAggregation?: EuropeanaAggregation
  aggregations?: EuropeanaAggregation[]
  providedCHOs?: ProvidedCHO[]
  edmPreview?: string[]
  edmIsShownBy?: string
  edmIsShownAt?: string
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
