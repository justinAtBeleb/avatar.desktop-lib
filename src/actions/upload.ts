import { sliceHighlight, sliceSession } from '../editor/slice'
import { sendUpdateEventForId } from '../events/events'
import { highlightsStore } from '../storage/highlights'
import { HighlightType, UploadStatus } from '../types'
import { upload } from '../upload'
import { logger } from '../util/logger'
import { EditorPayload } from './types'

const log = logger('actions/upload.ts')

export const uploadHighlight = async (highlightId: string, title: string, type: HighlightType ,token: string) => {
  await highlightsStore.setStatus(highlightId, UploadStatus.UPLOADING)
  sendUpdateEventForId(highlightId)
  
  const highlight = await highlightsStore.getById(highlightId)

  try {
    await upload({ ...highlight, title, type }, token)
    await highlightsStore.setStatus(highlightId, UploadStatus.UPLOADED)
  } catch (e) {
    log('Failed to upload', e.message)
    
    if (e.response?.status == 429) { // limit exceeded
      await highlightsStore.setStatus(highlightId, UploadStatus.LIMIT_EXCEEDED)
    } else { // other error
      await highlightsStore.setStatus(highlightId, UploadStatus.ERROR)
    }
  }
  
  sendUpdateEventForId(highlightId)
}

const uploadEventHighlight = async (payload: EditorPayload) => {
  const highlight = await sliceHighlight(payload.highlightId, payload.from, payload.to)

  await highlightsStore.add({
    ...highlight,
    title: payload.title || highlight.title,
    type: payload.type || highlight.type
  })

  await uploadHighlight(highlight.id, payload.title, payload.type, payload.token)
}

const uploadNonEventHighlight = async (payload: EditorPayload) => {
  const highlight = await sliceSession(payload.highlightId, payload.from, payload.to)

  await highlightsStore.add({
    ...highlight,
    title: payload.title || highlight.title,
    type: payload.type || highlight.type,
  })

  await uploadHighlight(highlight.id, payload.title, payload.type, payload.token)
}

export const uploadEditedHighlight = async (payload: EditorPayload) => {
  if (payload.events) {
    uploadEventHighlight(payload)
  } else {
    uploadNonEventHighlight(payload)
  }
}
