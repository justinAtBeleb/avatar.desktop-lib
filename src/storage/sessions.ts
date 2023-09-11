import { deleteVideo } from '../recorder/helpers'
import { AutoDeletePeriod, Session } from '../types'
import { logger } from '../util/logger'
import { db } from './db'
import { highlightsStore } from './highlights'
import { parseAutoDeletePeriod } from './util'

const log = logger('storage/sessions.ts')

const getById = async (sessionId: string): Promise<Session> => {
  const session = await db.get('sessions', sessionId)

  return { ...session, plays: [] }
}

const getAll = async (): Promise<Session[]> => {
  const sessions = await db.getAllFromIndex('sessions', 'by-date')
  const highlights = await db.getAllFromIndex('highlights', 'by-start-time')
  
  const map = {}

  for (const highlight of highlights) {
    if (highlight.sessionId && highlight.location == 'highlights') {

      if (!map[highlight.sessionId]) {
        map[highlight.sessionId] = []
      }

      map[highlight.sessionId].push(highlight)
    }
  }

  return sessions.map(session => ({
    ...session,
    plays: map[session.id] || []
  }))
}

const add = async (session: Session) => {
  const toAdd = { ...session, plays: undefined }

  db.add('sessions', toAdd)
}

const deleteById = (sessionId: string) => {
  return db.delete('sessions', sessionId)
}

const deleteMany = (sessionIds: string[]) => {
  const tx = db.transaction('sessions', 'readwrite')

  for (const id of sessionIds) {
    tx.store.delete(id)
  }

  return tx.done
}

const getNumberOfHighlights = async (sessionId: string) => {
  const highlights = await highlightsStore.getAll()

  return highlights.filter(h => h.sessionId == sessionId).length
}

const deleteOld = async (period: AutoDeletePeriod) => {
  const threshold = Date.now() - parseAutoDeletePeriod(period)

  const oldSessions = await db.getAllFromIndex('sessions', 'by-date', IDBKeyRange.upperBound(threshold))

  const sessionIds = oldSessions.map(s => s.id)

  await deleteMany(sessionIds)

  const highlights = await highlightsStore.getAll()

  const oldHighlights = highlights.filter(highlight => 
    sessionIds.includes(highlight.sessionId) && 
    highlight.location == 'highlights'
  )

  const tx = db.transaction('highlights', 'readwrite')

  for (const highlight of oldHighlights) {
    tx.store.delete(highlight.id)
  }

  await tx.done

  await Promise.all(oldHighlights.map(h => deleteVideo(h.url)))
  await Promise.all(oldSessions.filter(s => s.url).map(s => deleteVideo(s.url)))

  const currentHighlightIds = (await highlightsStore.getAll()).map(h => h.url)

  overwolf.media.videos.getVideos(result => {
    log('Get all videos result', result)
    if (result.success) {
      for (const video of result.videos) {
        if (!currentHighlightIds.includes(video)) {
          log('Deleting video', video)
          deleteVideo(video)
        }
      }
    }
  })
}

export const sessionsStore = {
  getAll, add, deleteById, getNumberOfHighlights, deleteOld, getById
}
