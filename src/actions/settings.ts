import { sendEvent } from '../events/events'
import * as settingsStore from '../storage/settings'
import { RecordingSettings } from '../types'

export const handleReadSettings = () => {
  const settings = settingsStore.readSettings()

  sendEvent({ type: 'SETTINGS_UPDATE', payload: settings })
}

export const handleUpdateSettings = (payload: RecordingSettings) => {
  settingsStore.updateSettings(payload)
}
