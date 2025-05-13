import type { AtpAgent } from '@atproto/api'
import { loadImageSource } from '../utils/loadImageSource.js'
import { resizeToJpeg } from '../utils/resizeToJpeg.js'

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
      console.error('❌ Зображення перевищує допустимий розмір 1 MB')
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
