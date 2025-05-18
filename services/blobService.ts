import type { AtpAgent } from '@atproto/api'
import { loadImageSource } from '../utils/loadImageSource.js'
import { resizeToJpeg } from '../utils/resizeToJpeg.js'

/**
 * Uploads an image to Bluesky (via the atproto blob API).
 * Accepts either a remote URL or a local Buffer.
 *
 * Steps:
 * 1. Load the source as a Buffer (handles string URL, file path, or Buffer).
 * 2. Resize and convert to JPEG.
 * 3. Ensure it’s under 1MB (Bluesky limitation).
 * 4. Wrap it in a Blob and upload via the agent.
 * 5. Return the final structure with CID and metadata.
 */

export async function uploadImage(
  agent: AtpAgent,
  source: string | Buffer,
): Promise<{
  $type: 'blob'
  ref: { $link: string }
  mimeType: string
  size: number
} | undefined> {
  try {
    const rawBuffer = await loadImageSource(source)
    const jpegBuffer = await resizeToJpeg(rawBuffer)

    if (jpegBuffer.length > 1_000_000) {
      console.error('❌ Image exceeds the 1MB limit')
      return
    }

    const blob = new Blob([jpegBuffer], { type: 'image/jpeg' })
    const uploaded = await agent.com.atproto.repo.uploadBlob(blob)
    const result = uploaded.data.blob

    const cid = result?.ref?.toString?.()
    if (!cid) {
      console.warn('⚠️ Uploaded blob is missing ref')
      return undefined
    }

    return {
      $type: 'blob',
      ref: { $link: cid },
      mimeType: result.mimeType,
      size: result.size,
    }
  }
  catch (error) {
    console.error('❌ Error uploading image:', error)
    return undefined
  }
}
