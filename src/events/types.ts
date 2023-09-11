import { RecordingSettings } from '../types'

export type AvatarLibEvent =
| { type: 'SETTINGS_UPDATE', payload: RecordingSettings }
| { type: 'GAME_END' }

export type AvatarInternalEvent = 
| { type: 'HIGHLIGHTS_UPDATE' }
| { type: 'LIBRARY_UPDATE' }
