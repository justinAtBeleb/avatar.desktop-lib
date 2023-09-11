import { RecordingSettings } from '../types'
import { defaultRecordingSettings } from '../util/config'
import { readStorage, writeStorage } from './util'

export const updateSettings = (settings: RecordingSettings) => {
  writeStorage<RecordingSettings>('recordingSettings', settings)
}

export const readSettings = () => {
  return readStorage<RecordingSettings>('recordingSettings', defaultRecordingSettings)
}
