export interface EmbedResult {
  embed?: {
    $type: 'app.bsky.embed.images'
    images: {
      image: {
        ref: {
          $link: string
        }
        mimeType: string
        size: number
      }
      alt: string
    }[]
  }
  debugInfo: {
    tried: Record<string, string>
    skipped?: Record<string, string>
    result?: {
      url: string
      alt?: string
      mimeType: string
      size: number
      source: string
    }
  }
}
