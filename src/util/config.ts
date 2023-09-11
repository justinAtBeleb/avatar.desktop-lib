import { RecordingSettings } from '../types'
import { logger } from './logger'

type Environment = 'local' | 'dev' | 'stage' | 'prod'

const log = logger('config')

export const VERSION = '0.3.18'

export const config = {
  frontendUrl: 'http://localhost:3000',
  uploadUrl: 'http://localhost:8082',
  coreUrl: 'http://localhost:8080',
}

type UrlOverride = {
  frontend?: string
}

export const setEnv = (env: Environment, urlOverride?: UrlOverride) => {
  log(`Setting environment to ${env}`)
  switch(env) {
  case 'dev':
    config.frontendUrl = urlOverride?.frontend || 'https://frontend-dev.avatar.app.buff.game'
    config.uploadUrl = 'https://upload-dev.avatar.app.buff.game/upload'
    config.coreUrl = 'https://core-dev.avatar.app.buff.game'
    break
  case 'stage':
    config.frontendUrl = urlOverride?.frontend || 'https://frontend-stage.avatar.app.buff.game'
    config.uploadUrl = 'https://upload-stage.avatar.app.buff.game/upload'
    config.coreUrl = 'https://core-stage.avatar.app.buff.game'
    break
  case 'prod':
    config.frontendUrl = urlOverride?.frontend || 'https://frontend.avatar.app.buff.game'
    config.uploadUrl = 'https://upload.avatar.app.buff.game/upload'
    config.coreUrl = 'https://core.avatar.app.buff.game'
    break
  }
}

export const updateAvatarIframeConfig = (iframes: any) => {
  Object.keys(iframes).forEach(key => {
    if (iframes[key].services?.includes('AvatarService')) {
      const url = new URL(iframes[key].url)
      const newUrl = new URL(config.frontendUrl)

      newUrl.pathname = url.pathname
      newUrl.search = url.search

      iframes[key].url = newUrl.toString()
    }
  })
}

export const defaultRecordingSettings: RecordingSettings = {
  enable: false,
  autoDeletePeriod: '48 hours',
  resolution: '1280 x 720',
  framerate: 30,
  customBitrate: false,
  bitrate: 6000,
  micAudio: false,
  micVolume: 20,
  gameAudio: false,
  gameVolume: 80,
  recordFullEventGames: false
} as const
