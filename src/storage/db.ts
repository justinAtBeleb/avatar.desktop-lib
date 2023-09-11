import { DBSchema, IDBPDatabase, openDB } from 'idb'
import { Highlight, Session } from '../types'

interface Schema extends DBSchema {
  sessions: {
    key: string
    value: Omit<Session, 'plays'>
    indexes: { 'by-date': number }
  }
  highlights: {
    key: string
    value: Highlight
    indexes: { 'by-start-time': number }
  }
}

export let db: IDBPDatabase<Schema> = undefined

export const initDB = async () => {
  db = await openDB('avatar', 1, {
    upgrade: db => {
      const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
      const highlights = db.createObjectStore('highlights', { keyPath: 'id' })

      sessions.createIndex('by-date', 'date')
      highlights.createIndex('by-start-time', 'startTime')
    }
  })
}
