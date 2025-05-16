import fetch from 'node-fetch'

/**
 * Translates text using the DeepL API.
 * @param text - Text to translate.
 * @param sourceLang - Source language (optional, default = 'auto').
 * @param targetLang - Target language (default = 'EN').
 * @returns Translated text or undefined if failed.
 */
export async function translateText(
  text: string,
  sourceLang: string = 'auto',
  targetLang: string = 'EN',
): Promise<string | undefined> {
  const apiKey = process.env.DEEPL_API_KEY

  if (!apiKey) {
    console.warn('⚠️ Missing DeepL API key')
    return undefined
  }

  try {
    const body = new URLSearchParams({
      text,
      target_lang: targetLang,
    })

    if (sourceLang !== 'auto') {
      body.set('source_lang', sourceLang)
    }

    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
      body,
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
