import fetch from 'node-fetch'

/**
 * Translate text to a target language using DeepL API
 * @param text Text to translate
 * @param sourceLang Source language (optional, default 'auto')
 * @param targetLang Target language (default 'EN')
 * @returns Translated string or undefined
 */
export async function translateText(
  text: string,
  sourceLang: string = 'auto',
  targetLang: string = 'EN',
): Promise<string | undefined> {
  try {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang,
        ...(sourceLang !== 'auto' && { source_lang: sourceLang }),
      }),
    })

    if (!res.ok) {
      console.error(`❌ DeepL request failed: ${res.statusText}`)
      return undefined
    }

    const data = await res.json() as { translations?: { text: string }[] }
    return data.translations?.[0]?.text
  }
  catch (error) {
    console.error('⚠️ Error during DeepL translation:', error)
    return undefined
  }
}
