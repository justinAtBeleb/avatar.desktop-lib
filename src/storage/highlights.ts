import { DownloadStatus, Highlight, UploadStatus } from '../types'
import { db } from './db'

const getAll = (): Promise<Highlight[]> => {
  return db.getAll('highlights')
}

const getById = (highlightId: string): Promise<Highlight> => {
  return db.get('highlights', highlightId)
}

const add = (highlight: Highlight) => {
  return db.add('highlights', highlight)
}

const addMany = (highlights: Highlight[]) => {
  const tx = db.transaction('highlights', 'readwrite')

  highlights.forEach(highlight => {
    tx.store.add(highlight)
  })

  return tx.done
}

const deleteById = (highlightId: string) => {
  return db.delete('highlights', highlightId)
}

const deleteMany = (ids: string[]) => {
  return Promise.all(ids.map(id => db.delete('highlights', id)))
}

const update = (highlightId: string, newValue: Highlight) => {
  return db.put('highlights', newValue)
}

const setStatus = async (highlightId: string, status: UploadStatus) => {
  const highlight = await getById(highlightId)

  db.put('highlights', { ...highlight, status })
}

const setDownloadStatus = async (highlightId: string, status: DownloadStatus) => {
  const highlight = await getById(highlightId)

  db.put('highlights', { ...highlight, downloadStatus: status })
}

const setTitle = async (highlightId: string, title: string) => {
  const highlight = await getById(highlightId)

  db.put('highlights', { ...highlight, title })
}

const setLocation = async (highlightId: string, location: 'library' | 'highlights') => {
  const highlight = await getById(highlightId)

  db.put('highlights', { ...highlight, location })
}

export const highlightsStore = {
  getAll, getById, add, addMany, setStatus, setDownloadStatus, setTitle, setLocation, deleteById, deleteMany, update
}
