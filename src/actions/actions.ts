import { logger } from '../util/logger'
import { AvatarRequest } from './types'
import { handleReadSettings, handleUpdateSettings } from './settings'

const log = logger('actions/actions.ts')

export const handleRequest = (action: AvatarRequest) => {
  try {
    switch(action.type) {
    case 'UPDATE_SETTINGS':
      return handleUpdateSettings(action.payload)
    case 'RECORDING_SETTINGS_REQUEST':
      return handleReadSettings()
    }
  } catch (e) {
    log(`Action ${action.type} failed.`, e.message)
  }
}
