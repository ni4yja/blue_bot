import fs from 'node:fs/promises'

const FILE_PATH = './storage/posted.json'

export interface PostedRecord {
  link: string
  postedAt: string
}

export async function loadPosted(): Promise<PostedRecord[]> {
  try {
    const file = await fs.readFile(FILE_PATH, 'utf-8')
    return JSON.parse(file)
  }
  catch (error) {
    console.warn('⚠️ No posted.json found, starting fresh.', error)
    return []
  }
}

export async function savePosted(records: PostedRecord[]): Promise<void> {
  await fs.writeFile(FILE_PATH, JSON.stringify(records, null, 2))
}

export async function addPosted(link: string): Promise<void> {
  const posted = await loadPosted()
  posted.push({ link, postedAt: new Date().toISOString() })
  await savePosted(posted)
}

export function isAlreadyPosted(posted: PostedRecord[], link: string): boolean {
  return posted.some(record => record.link === link)
}
