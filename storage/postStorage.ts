import { promises as fs } from 'node:fs'
import path from 'node:path'

const POSTS_FILE_PATH = path.resolve('data/posts.json')

export interface StoredPost {
  link: string
  image?: string
  title: string
  description: string
}

/**
 * Loads posts from posts.json.
 * If the file doesn't exist or is empty, returns an empty array.
 */
export async function loadPosts(): Promise<StoredPost[]> {
  try {
    const data = await fs.readFile(POSTS_FILE_PATH, 'utf-8')
    return data.trim() ? JSON.parse(data) as StoredPost[] : []
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
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

/**
 * Finds a post by its link in a given array.
 */
export function findPostByLink(posts: StoredPost[], link: string): StoredPost | undefined {
  return posts.find(post => post.link === link)
}
