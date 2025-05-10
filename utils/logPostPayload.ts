export function logPostPayload(text: string, embed?: any, debugInfo?: Record<string, any>) {
  console.log('📝 Text to post:\n', text)

  if (embed) {
    const image = embed.images?.[0]
    console.log('🖼️ Image will be attached:')
    console.log('  ✏️ ALT:', image?.alt)
    console.log('  🔗 Ref:', image?.image?.ref)
    console.log('  🧾 Type:', debugInfo?.result?.mimeType)
    console.log('  📦 Size:', debugInfo?.result?.size, 'bytes')
    console.log('  🧭 Source:', debugInfo?.result?.source)
  }
  else {
    console.log('ℹ️ No embed attached.')
  }

  if (debugInfo?.tried) {
    console.log('🔎 Tried image sources:')
    Object.entries(debugInfo.tried).forEach(([key, url]) => {
      console.log(`   🔸 ${key}: ${url}`)
    })
  }

  console.log('📤 Full embed payload:', JSON.stringify(embed, null, 2))
}
