import { db } from './db'

const getAll = async () => {
  const highlights = await db.getAll('highlights')

  return highlights.filter(highlight => highlight.location == 'library')
}

export const libraryStore = {
  getAll
}
