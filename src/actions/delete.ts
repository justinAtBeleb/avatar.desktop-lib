import { sendUpdateEventForLocation, sendUpdateHighlightsEvent } from '../events/events'
import { highlightsStore } from '../storage/highlights'
import { sessionsStore } from '../storage/sessions'
import { sleep } from '../util/common'
import { logger } from '../util/logger'
import { DeleteHighlightPayload, DeleteSessionPayload } from './types'

const log = logger('actions/delete.ts')

export const deleteHighlight = async (payload: DeleteHighlightPayload) => {
  const highlight = await highlightsStore.getById(payload.highlightId)

  await highlightsStore.deleteById(payload.highlightId)

  const highlightsLeft = await sessionsStore.getNumberOfHighlights(highlight.sessionId)

  if (highlightsLeft == 0) {
    await sessionsStore.deleteById(highlight.sessionId)
  }

  sendUpdateEventForLocation(highlight.location)
    
  await sleep(1000) // wait for frontend to unload the video

  overwolf.media.videos.deleteVideo(highlight.url, result => log(result.error)) 
}

export const deleteSession = async (payload: DeleteSessionPayload) => {
  
  const highlights = await highlightsStore.getAll()
  const filtered = highlights.filter(highlight => highlight.sessionId === payload.sessionId)
  
  await sessionsStore.deleteById(payload.sessionId)
  await highlightsStore.deleteMany(filtered.map(h => h.id))

  sendUpdateHighlightsEvent()

  await sleep(1000) // wait for frontend to unload the video

  filtered.forEach(play => {
    overwolf.media.videos.deleteVideo(play.url, result => log(result.error))
  })
}
