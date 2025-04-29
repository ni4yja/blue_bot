export function formatPostData(
  title?: string,
  description?: string,
  link?: string,
) {
  const maxLength = 300
  const safeTitle = title || ''
  const safeDescription = description || ''
  const safeLink = link || ''

  const availableLength = maxLength - safeLink.length - 5 // запас для пробілу або роздільника
  let fullText = `${safeTitle}: ${safeDescription}`

  if (fullText.length > availableLength) {
    fullText = `${fullText.slice(0, availableLength - 1)}…`
  }

  const splitIndex = fullText.indexOf(': ')
  const finalTitle = splitIndex !== -1 ? fullText.slice(0, splitIndex) : fullText
  const finalDescription = splitIndex !== -1 ? fullText.slice(splitIndex + 2) : ''

  return {
    title: finalTitle.trim(),
    description: finalDescription.trim(),
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[\n\r]+/g, ' ') // замінюємо переноси на пробіл
    .replace(/\s{2,}/g, ' ') // замінюємо кілька пробілів одним
    .trim()
}
