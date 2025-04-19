export interface EuropeanaApiResponse {
  apikey: string
  success: boolean
  statsDuration: number
  requestNumber: number
  object: EuropeanaRecordObject
}

export interface EuropeanaRecordObject {
  about: string
  europeanaAggregation?: EuropeanaAggregation
  aggregations?: EuropeanaAggregation[]
  edmDatasetName?: string[]
  europeanaCollectionName?: string[]
  europeanaCompleteness?: number
  organizations?: any[]
  providedCHOs?: ProvidedCHO[]
  proxies?: any[]
  timestamp_created?: string
  timestamp_created_epoch?: number
  timestamp_update?: string
  timestamp_update_epoch?: number
  type?: string
}

export interface EuropeanaAggregation {
  about?: string
  edmPreview?: string
  edmIsShownBy?: string
  edmIsShownAt?: string
  edmObject?: string
  edmDataProvider?: {
    def: string[]
  }
  edmProvider?: {
    def: string[]
  }
  edmRights?: {
    def: string[]
  }
}

export interface ProvidedCHO {
  dcTitle?: string[]
  dcDescription?: string[]
  dcCreator?: string[]
  dcDate?: string[]
  dcType?: string[]
  dcSubject?: string[]
}
