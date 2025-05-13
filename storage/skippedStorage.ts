import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

const SKIPPED_PATH = './storage/skipped.json'

export async function loadSkipped(): Promise<string[]> {
  if (!existsSync(SKIPPED_PATH)) {
    await writeFile(SKIPPED_PATH, JSON.stringify([]))
    return []
  }

  const raw = await readFile(SKIPPED_PATH, 'utf-8')
  try {
    return JSON.parse(raw)
  }
  catch {
    return []
  }
}

export async function addSkipped(link: string): Promise<void> {
  const skipped = await loadSkipped()
  if (!skipped.includes(link)) {
    skipped.push(link)
    await writeFile(SKIPPED_PATH, JSON.stringify(skipped, null, 2))
  }
}

export function isAlreadySkipped(skipped: string[], link: string): boolean {
  return skipped.includes(link)
}
