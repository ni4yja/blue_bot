import { promises as fs } from 'node:fs'
import path from 'node:path'

const POSTS_FILE_PATH = path.resolve('storage/posts.json')

export interface StoredPost {
  link: string
  image?: string
  title: string
  description: string
}

export async function loadPosts(): Promise<StoredPost[]> {
  try {
    const data = await fs.readFile(POSTS_FILE_PATH, 'utf-8')

    if (!data.trim()) {
      // Якщо файл існує, але пустий
      return []
    }

    return JSON.parse(data) as StoredPost[]
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Якщо файла нема — повертаємо порожній масив
      return []
    }
    throw error
  }
}

export async function savePost(newPost: StoredPost): Promise<void> {
  const posts = await loadPosts()

  // Перевіряємо чи такий пост уже є
  const existingIndex = posts.findIndex(post => post.link === newPost.link)

  if (existingIndex !== -1) {
    posts[existingIndex] = newPost // оновлюємо існуючий пост
  }
  else {
    posts.push(newPost) // додаємо новий пост
  }

  await fs.mkdir(path.dirname(POSTS_FILE_PATH), { recursive: true })
  await fs.writeFile(POSTS_FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
}

export function findPostByLink(posts: StoredPost[], link: string): StoredPost | undefined {
  return posts.find(post => post.link === link)
}
