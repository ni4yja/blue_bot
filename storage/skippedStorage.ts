import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

const SKIPPED_PATH = './data/skipped.json'

/**
 * Loads the list of skipped links from JSON file.
 */
export async function loadSkipped(): Promise<string[]> {
  if (!existsSync(SKIPPED_PATH)) {
    await writeFile(SKIPPED_PATH, JSON.stringify([]))
    return []
  }

  try {
    const raw = await readFile(SKIPPED_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  }
  catch (error) {
    console.warn('⚠️ Failed to read skipped.json:', error)
    return []
  }
}

/**
 * Adds a link to skipped.json if it hasn’t been added already.
 */
export async function addSkipped(link: string): Promise<void> {
  const skipped = await loadSkipped()

  if (!skipped.includes(link)) {
    skipped.push(link)
    await writeFile(SKIPPED_PATH, JSON.stringify(skipped, null, 2))
  }
}

/**
 * Checks whether a link is already marked as skipped.
 */
export function isAlreadySkipped(skipped: string[], link: string): boolean {
  return skipped.includes(link)
}
