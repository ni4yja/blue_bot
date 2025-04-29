import type { AtpAgent, BlobRef } from '@atproto/api'
import fetch from 'node-fetch'

export async function uploadImage(agent: AtpAgent, imageUrl: string): Promise<BlobRef | undefined> {
  try {
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok)
      throw new Error(`Failed to fetch image: ${imageRes.statusText}`)

    const buffer = await imageRes.arrayBuffer()

    const uploaded = await agent.com.atproto.repo.uploadBlob(new Uint8Array(buffer))

    return uploaded.data.blob
  }
  catch (error) {
    console.error('❌ Error uploading image:', error)
    return undefined
  }
}
