import { promises as fs } from 'node:fs'
import path from 'node:path'
import { generatePostCandidates } from '../services/generatePostCandidates'

export interface StoredPost {
  link: string
  image?: string
  title: string
  description: string
}

const POSTS_FILE_PATH = path.resolve('data/posts.json')

/**
 * Loads existing posts from posts.json file.
 * If the file exists but is empty or invalid, returns [].
 */
async function loadExistingPosts(): Promise<StoredPost[]> {
  try {
    const data = await fs.readFile(POSTS_FILE_PATH, 'utf-8')
    const parsed = JSON.parse(data) as StoredPost[]

    if (!Array.isArray(parsed)) {
      throw new TypeError('❌ posts.json is not a valid array')
    }
    return parsed
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn('⚠️ posts.json not found')
      return []
    }
    console.error('❌ Failed to read or parse posts.json:', err)
    throw err
  }
}

/**
 * Generates posts using a generator function and writes them to file.
 */
async function generateAndSavePosts(): Promise<StoredPost[]> {
  const posts = await generatePostCandidates()

  if (posts.length === 0) {
    console.warn('⚠️ No posts generated — skipping write')
    return []
  }

  await fs.mkdir(path.dirname(POSTS_FILE_PATH), { recursive: true })
  await fs.writeFile(POSTS_FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')

  return posts
}

/**
 * Loads posts from file or generates new ones if file is missing or empty.
 */
export async function loadPosts(): Promise<StoredPost[]> {
  const existingPosts = await loadExistingPosts()

  if (existingPosts.length > 0) {
    return existingPosts
  }

  console.warn('⚠️ posts.json is empty — generating new posts...')
  return await generateAndSavePosts()
}

/**
 * Saves a post to posts.json.
 * If the post already exists by link, updates it.
 * Otherwise, appends it.
 */
export async function savePost(newPost: StoredPost): Promise<void> {
  const posts = await loadPosts()
  const existingIndex = posts.findIndex(post => post.link === newPost.link)

  if (existingIndex !== -1) {
    posts[existingIndex] = newPost
  }
  else {
    posts.push(newPost)
  }

  await fs.mkdir(path.dirname(POSTS_FILE_PATH), { recursive: true })
  await fs.writeFile(POSTS_FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
}
