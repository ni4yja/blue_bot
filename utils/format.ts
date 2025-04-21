export function formatPostData(title: string, description: string, link: string): { title: string, description: string } {
  const MAX_TOTAL_LENGTH = 300
  const linkLength = link.length
  const spaceForText = MAX_TOTAL_LENGTH - linkLength - 10 // запас для емодзі, префіксів

  const trimmedTitle = title.length > 100 ? `${title.slice(0, 100)}…` : title
  const spaceForDescription = spaceForText - trimmedTitle.length

  let trimmedDescription = description
  if (description.length > spaceForDescription) {
    trimmedDescription = `${description.slice(0, spaceForDescription - 1).trim()}…`
  }

  return { title: trimmedTitle, description: trimmedDescription }
}
