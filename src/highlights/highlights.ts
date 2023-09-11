import { highlightsStore } from '../storage/highlights'
import { Pipe, runPipeline } from './pipeline'
import { DownloadStatus, Event, EventGroup, Highlight, HighlightType, SessionCapture, UploadStatus } from '../types'
import { logger } from '../util/logger'
import { createVideoComposition, deleteVideo, max, min } from '../recorder/helpers'
import { plugin } from '../plugin/AvatarPlugin'
import { v4 as uuid } from 'uuid'
import { sendUpdateHighlightsEvent } from '../events/events'
import { sessionsStore } from '../storage/sessions'

const log = logger('highlights/highlights.ts')

const checkUrl: Pipe<SessionCapture> = capture => {
  if (!capture.url) {
    throw new Error('Missing video URL')
  }

  return capture
}

const checkAborted: Pipe<SessionCapture> = async capture => {
  if (capture.aborted) {
    await deleteVideo(capture.url)
    return false
  }
  return capture
}

const checkFullGame: Pipe<SessionCapture> = capture => {
  if (!capture.filterOptions.deleteFullVideo) {
    return {
      ...capture,
      session: {
        ...capture.session,
        url: capture.url,
        path: capture.path
      }
    }
  }

  return capture
}

const groupEvents: Pipe<SessionCapture> = capture => {
  const { events, filterOptions } = capture
  
  const groups = events.reduce((groups: EventGroup[], event: Event) => {
    const leadUp = event.name == 'manual' ? 12000 : filterOptions.leadUp
    const aftermath = event.name == 'manual' ? 0 : filterOptions.aftermath
    
    if (groups.length === 0) { // this is the first event
      return [{
        time: event.time,
        past: leadUp,
        future: aftermath,
        events: [event],
      }]
    }
    
    const mergeThreshold = event.label == 'penta_kill' ? 30000 : filterOptions.mergeThreshold
    const lastGroup = groups[groups.length - 1]
    const timeDiff = event.time - lastGroup.time

    if (timeDiff < mergeThreshold) { // this event is close enough to the last event
      return [
        ...groups.slice(0, groups.length - 1),
        {
          time: event.time,
          past: lastGroup.past + timeDiff,
          future: aftermath,
          events: [...lastGroup.events, event],
        }
      ]
    } else { // this event is far enough from the last event
      return [
        ...groups,
        {
          time: event.time,
          past: leadUp,
          future: aftermath,
          events: [event],
        }
      ]
    }
  }, [])

  return { ...capture, groups }
}

const createPlays: Pipe<SessionCapture> = async capture => {
  const { groups, startTime, endTime, url } = capture

  const plays: Highlight[] = []

  for (const group of groups) {
    const time = group.time - startTime
    const before = group.past
    const after = group.future

    const duration = endTime - startTime

    const start = Math.floor(max(time - before, 0))
    const end = Math.floor(min(time + after, duration - 100))
    
    const length = end - start

    try {
      const response = await createVideoComposition(url, [
        {
          startTime: start,
          endTime: end,
        },
      ])

      if (response.url && response.path) {
        plays.push({
          id: uuid(),
          game: capture.session.game,
          date: capture.session.date + start,
          url: response.url,
          path: response.path,
          events: group.events,
          tags: [],
          length: length,
          status: UploadStatus.NOT_UPLOADED,
          downloadStatus: DownloadStatus.NOT_DOWNLOADED,
          title: '',
          code: '',
          sessionId: capture.session.id,
          location: 'highlights',
          startTime: startTime + start,
          type: HighlightType.GENERAL
        })
      } else {
        log('Missing url or path', response)
      }
    } catch (e) {
      log('Failed to create video composition', e)
    }
  }

  return { ...capture, session: { ...capture.session, plays } }
}

const addLength: Pipe<SessionCapture> = capture => {
  capture.session.length = capture.endTime - capture.startTime

  return capture
}

const addTags: Pipe<SessionCapture> = capture => {
  for (const play of capture.session.plays) {
    for (const event of play.events) {
      if (event.name && !play.tags.includes(event.name)) {
        play.tags.push(event.name)
      }
    }
  }

  return capture
}

const signVideos: Pipe<SessionCapture> = async capture => {
  if (!capture.filterOptions.deleteFullVideo && capture.session.path) {
    capture.session.code = await plugin.signVideo(capture.session.path)
  }

  for (const play of capture.session.plays) {
    play.code = await plugin.signVideo(play.path)
  }

  return capture
}

const saveSession: Pipe<SessionCapture> = async capture => {
  await highlightsStore.addMany(capture.session.plays)
  await sessionsStore.add({ ...capture.session, plays: [] })

  return capture
}

const broadcastEvent: Pipe<SessionCapture> = async capture => {
  sendUpdateHighlightsEvent()

  return capture
}

const deleteFullVideo: Pipe<SessionCapture> = async capture => {
  if (capture.filterOptions.deleteFullVideo) {
    await deleteVideo(capture.url)
  }

  return capture
}

export const processGameSession = (capture: SessionCapture) => {
  log('Requesting idle callback')
  requestIdleCallback(() => {
    log('Idle callback running')
    runPipeline(capture, [
      { name: 'checkUrl', fn: checkUrl },
      { name: 'checkAborted', fn: checkAborted },
      { name: 'checkFullGame', fn: checkFullGame },
      { name: 'groupEvents', fn: groupEvents },
      { name: 'createPlays', fn: createPlays },
      { name: 'addLength', fn: addLength },
      { name: 'addTags', fn: addTags },
      { name: 'signVideos', fn: signVideos },
      { name: 'saveSession', fn: saveSession },
      { name: 'broadcastEvent', fn: broadcastEvent },
      { name: 'deleteFullVideo', fn: deleteFullVideo },
    ])
  })
}
