import type { BskyAgent } from '@atproto/api'
import fetch from 'node-fetch'

export async function uploadImage(agent: BskyAgent, imageUrl: string) {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Error fetching image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    const blob = await agent.uploadBlob(imageBuffer, { encoding: 'image/jpeg' })
    return blob.data.blob
  }
  catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}
