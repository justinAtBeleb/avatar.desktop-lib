import  * as settingsStore from '../storage/settings'
import { RecordingSettings, Resolution } from '../types'
import { defaultStreamSettings, SUPPORTED_GAME } from '../util/constants'
import { logger } from '../util/logger'

const log = logger('recorder/helpers.ts')

type Segment = overwolf.media.videos.VideoCompositionSegment;
type FileResult = overwolf.media.FileResult;

export const createVideoComposition = (url: string, segments: Segment[]): Promise<FileResult> => {
  return new Promise((resolve, reject) => {
    overwolf.media.videos.createVideoComposition(url, { segments }, response => {
      if (response.success) resolve(response)
      else reject(response)
    })
  })
}

export const deleteVideo = (url: string): Promise<boolean> => {
  return new Promise(resolve => {
    overwolf.media.videos.deleteVideo(url, result => {
      resolve(result.success)
    })
  })
}

export const max = (a: number, b: number) => {
  return a > b ? a : b
}

export const min = (a: number, b: number) => {
  return a < b ? a : b
}

export const parseResolution = (resolution: Resolution) => {
  switch(resolution) {
  case Resolution.FULL_HD:
    return { width: 1920, height: 1080 }
  case Resolution.HD:
    return { width: 1280, height: 720 }
  case Resolution['480P']:
    return { width: 640, height: 480 }
  default:
    return { width: 1280, height: 720 }
  }
}

export const parseRecordingSettings = (settings: RecordingSettings): overwolf.streaming.StreamSettings => {
  return {
    ...defaultStreamSettings,
    settings: {
      ...defaultStreamSettings.settings,
      audio: {
        ...defaultStreamSettings.settings.audio,
        mic: {
          ...defaultStreamSettings.settings.audio.mic,
          enable: settings.micAudio,
          volume: settings.micVolume
        },
        game: {
          ...defaultStreamSettings.settings.audio.game,
          enable: settings.gameAudio,
          volume: settings.gameVolume
        }
      },
      video: {
        ...defaultStreamSettings.settings?.video,
        ...parseResolution(settings.resolution),
        fps: settings.framerate,
        auto_calc_kbps: !settings.customBitrate,
        max_kbps: settings.customBitrate ? settings.bitrate : defaultStreamSettings.settings.video.max_kbps
      }
    }
  }
}

export const requestRecording = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const settings = parseRecordingSettings(settingsStore.readSettings())

    overwolf.streaming.start(settings, response => {
      log('Streaming requested', response)

      if (response.stream_id) resolve(response.stream_id)
      else reject(response)
    })
  })
}

export const isSupported = (gameId: number) => {
  const supported: number[] = Object.values(SUPPORTED_GAME)

  return supported.includes(gameId)
}
