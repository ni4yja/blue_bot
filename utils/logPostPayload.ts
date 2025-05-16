/* eslint-disable no-console */
/**
 * Logs the payload that would be posted to Bluesky.
 * Used for dry-run or debugging.
 */
export function logPostPayload(
  text: string,
  embed?: any,
  debugInfo?: Record<string, any>,
): void {
  console.log('📝 Text to post:\n', text)

  if (embed?.images?.[0]) {
    const image = embed.images[0]

    console.log('🖼️ Image will be attached:')
    console.log('  ✏️ ALT:', image.alt)
    console.log('  🔗 Ref:', image.image?.ref)
    console.log('  🧾 Type:', debugInfo?.result?.mimeType)
    console.log('  📦 Size:', debugInfo?.result?.size, 'bytes')
    console.log('  🧭 Source:', debugInfo?.result?.source)
  }
  else {
    console.log('ℹ️ No embed attached.')
  }

  if (debugInfo?.tried && Object.keys(debugInfo.tried).length > 0) {
    console.log('🔎 Tried image sources:')
    for (const [key, url] of Object.entries(debugInfo.tried)) {
      console.log(`   🔸 ${key}: ${url}`)
    }
  }

  if (embed) {
    console.log('📤 Full embed payload:', JSON.stringify(embed, null, 2))
  }
}
