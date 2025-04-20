export interface EuropeanaApiResponse {
  object: EuropeanaRecordObject
}

export interface EuropeanaRecordObject {
  europeanaAggregation?: EuropeanaAggregation
  aggregations?: EuropeanaAggregation[]
  providedCHOs?: ProvidedCHO[]
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
