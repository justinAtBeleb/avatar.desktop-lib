import { sliceHighlight, sliceSession } from '../editor/slice'
import { sendUpdateLibraryEvent, sendUpdateHighlightsEvent, sendUpdateEventForId } from '../events/events'
import { exportVideo } from '../export'
import { highlightsStore } from '../storage/highlights'
import { DownloadStatus, VideoLocation } from '../types'
import { logger } from '../util/logger'
import { EditorPayload } from './types'

const log = logger('actions/save.ts')

export const downloadHighlight = async (highlightId: string) => {
  await highlightsStore.setDownloadStatus(highlightId, DownloadStatus.DOWNLOADING)
  sendUpdateEventForId(highlightId)
  
  const highlight = await highlightsStore.getById(highlightId)

  try {
    await exportVideo(highlight.path, `BUFF_${highlight.id}.mp4`)
    await highlightsStore.setDownloadStatus(highlightId, DownloadStatus.DOWNLOADED)
  } catch (e) {
    log('Failed to export video', e.message)
    await highlightsStore.setDownloadStatus(highlightId, DownloadStatus.ERROR)
  }

  sendUpdateEventForId(highlightId)
}

export const moveToLibrary = async (highlightId: string) => {
  const original = await highlightsStore.getById(highlightId)

  await highlightsStore.update(highlightId, { ...original, location: VideoLocation.LIBRARY })

  sendUpdateLibraryEvent()
  sendUpdateHighlightsEvent()
}

const saveEventHighlight = async (payload: EditorPayload) => {
  const highlight = await sliceHighlight(payload.highlightId, payload.from, payload.to)

  await highlightsStore.add({
    ...highlight,
    title: payload.title || highlight.title,
    type: payload.type || highlight.type,
    location: VideoLocation.LIBRARY
  })

  sendUpdateLibraryEvent()

  if (highlight.location == 'highlights') {
    sendUpdateHighlightsEvent()
  }
}

const saveNonEventHighlight = async (payload: EditorPayload) => {
  const highlight = await sliceSession(payload.highlightId, payload.from, payload.to)

  await highlightsStore.add({
    ...highlight,
    title: payload.title || highlight.title,
    type: payload.type || highlight.type,
    location: VideoLocation.LIBRARY,
  })

  sendUpdateLibraryEvent()
}

export const saveEditedHighlight = async (payload: EditorPayload) => {
  if (payload.events) {
    saveEventHighlight(payload)
  } else {
    saveNonEventHighlight(payload)
  }
}
