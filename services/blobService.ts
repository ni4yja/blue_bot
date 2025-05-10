import type { AtpAgent, BlobRef } from '@atproto/api'
import fetch from 'node-fetch'

export async function uploadImage(agent: AtpAgent, imageUrl: string): Promise<BlobRef | undefined> {
  const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_BLOB_SIZE = 976 * 1024

  try {
    const imageRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlueBot/1.0; +https://yourbot.site)',
      },
    })
    if (!imageRes.ok)
      throw new Error(`Failed to fetch image: ${imageRes.statusText}`)

    const buffer = await imageRes.arrayBuffer()
    if (buffer.byteLength > MAX_BLOB_SIZE) {
      console.warn('🚫 Image too large:', buffer.byteLength, 'bytes')
      return undefined
    }

    const contentType = imageRes.headers.get('content-type') || ''
    if (!SUPPORTED_TYPES.includes(contentType)) {
      console.warn('⚠️ Unsupported image type:', contentType)
      return undefined
    }

    const uploaded = await agent.com.atproto.repo.uploadBlob(new Uint8Array(buffer))

    return uploaded.data.blob
  }
  catch (error) {
    console.error('❌ Error uploading image:', error)
    return undefined
  }
}
