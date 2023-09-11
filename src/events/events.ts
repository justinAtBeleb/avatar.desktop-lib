import { highlightsStore } from '../storage/highlights'
import { logger } from '../util/logger'
import { AvatarInternalEvent, AvatarLibEvent } from './types'
import type { VideoLocation } from '../types'

const log = logger('events/events.ts')
const bc = new BroadcastChannel('avatar-lib-bc')

export const sendEvent = (event: AvatarLibEvent) => {
  log('Sending event.', event)

  const iframe = document.getElementById('avatar-comm-iframe') as HTMLIFrameElement

  if (!iframe) {
    log('Comm iframe missing.', event)
  } else {
    iframe.contentWindow.postMessage(event, '*')
  }

}

export const sendUpdateHighlightsEvent = () => {
  const message: AvatarInternalEvent = { type: 'HIGHLIGHTS_UPDATE' }
  bc.postMessage(message)
}

export const sendUpdateLibraryEvent = () => {
  const message: AvatarInternalEvent = { type: 'LIBRARY_UPDATE' }
  bc.postMessage(message)
}

export const sendUpdateEventForLocation = async (location: VideoLocation) => {
  if (location == 'highlights') {
    sendUpdateHighlightsEvent()
  } else if (location == 'library') {
    sendUpdateLibraryEvent()
  } else if (location == 'both') {
    sendUpdateHighlightsEvent()
    sendUpdateLibraryEvent()
  }
}

export const sendUpdateEventForId = async (highlightId: string) => {
  const highlight = await highlightsStore.getById(highlightId)

  sendUpdateEventForLocation(highlight.location)
}
