import { HighlightType, RecordingSettings } from '../types'

export type DeleteHighlightPayload = {
    highlightId: string
}

export type DeleteSessionPayload = {
    sessionId: string
}

export type UpdateTitlePayload = {
    highlightId: string
    title: string
}

export type UploadHighlightPayload = {
    highlightId: string
    token: string
}

export type DownloadHighlightPayload = {
    highlightId: string
}

export type EditorPayload = {
    highlightId: string
    from: number
    to: number
    token: string
    events: boolean
    title: string
    type: HighlightType
}

export type SaveToLibraryPayload = {
    highlightId: string
}

export type AvatarRequest = 
| { type: 'UPDATE_SETTINGS', payload: RecordingSettings }
| { type: 'RECORDING_SETTINGS_REQUEST' }
