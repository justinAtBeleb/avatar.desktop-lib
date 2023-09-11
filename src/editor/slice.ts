import { v4 as uuid } from 'uuid'
import { plugin } from '../plugin/AvatarPlugin'
import { highlightsStore } from '../storage/highlights'
import { sessionsStore } from '../storage/sessions'
import { logger } from '../util/logger'
import { Highlight, HighlightType, Session, UploadStatus, VideoLocation } from '../types'

const log = logger('editor/editor.ts')

export type SliceVideoResult = {
  id: string
  code: string
  url: string
  path: string
  length: number
}

export const sliceVideo = (highlight: Highlight | Session, from: number, to: number) => {
  return new Promise<SliceVideoResult>((resolve, reject) => {
    overwolf.media.videos.createVideoComposition(highlight.url, { segments: [
      { startTime: Math.floor(from), endTime: Math.floor(to) }
    ] }, async result => {
      log('Slice video result ', result)
      if (result.success && result.url && result.path) {

        const code = await plugin.signVideo(result.path)

        resolve({
          id: uuid(),
          code,
          url: result.url,
          path: result.path,
          length: to - from,
        })
      }
      else {
        reject('Failed to slice video. ' + result.error)
      }
    })
  })
}

export const sliceHighlight = async (highlightId: string, from: number, to: number) => {
  let highlight = await highlightsStore.getById(highlightId)

  if (from >= 0 || to < highlight.length) {
    const sliced = await sliceVideo(highlight, from, to)

    highlight = { ...highlight, ...sliced }
  }

  return highlight
}

export const sliceSession = async (sessionId: string, from: number, to: number): Promise<Highlight> => {
  const session = await sessionsStore.getById(sessionId)

  const sliced = await sliceVideo(session, from, to)

  return {
    ...sliced,
    game: session.game,
    date: session.date,
    events: [],
    tags: [],
    status: UploadStatus.NOT_UPLOADED,
    sessionId: session.id,
    startTime: from,
    type: HighlightType.GENERAL,
    title: '',
    location: VideoLocation.HIGHLIGHTS,
  }
}
