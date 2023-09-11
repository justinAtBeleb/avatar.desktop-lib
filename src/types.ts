export interface SessionData {
    name: string;
    value: string | number;
}

export interface Session {
    id: string
    game: number;
    gameTitle: string;
    date: number;
    plays: Highlight[];
    data: SessionData[];
    bookmarks: Bookmark[];
    url?: string;
    path?: string;
    events: boolean;
    code: string;
    length: number;
}

export interface KD {
    kills: number;
    deaths: number;
}

export interface KDA extends KD {
    assists: number;
}

export interface Bookmark {
    time: number;
}

export const UploadStatus = {
  NOT_UPLOADED: 'NOT_UPLOADED',
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  ERROR: 'ERROR',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED'
} as const

export type UploadStatus = keyof typeof UploadStatus

export const DownloadStatus = {
  NOT_DOWNLOADED: 'NOT_DOWNLOADED',
  DOWNLOADING: 'DOWNLOADING',
  DOWNLOADED: 'DOWNLOADED',
  ERROR: 'ERROR'
} as const

export type DownloadStatus = keyof typeof DownloadStatus

export const HighlightType = {
  GENERAL: 'General',
  OUT_PLAY: 'Out play',
  FUNNY: 'Funny',
  FAIL:  'Fail'
} as const

export type HighlightType = typeof HighlightType[keyof typeof HighlightType]

export interface Highlight {
    id: string;
    url: string;
    game: number;
    date: number;
    path: string;
    events: Event[];
    tags: string[];
    length: number
    title: string;
    code: string;
    status: UploadStatus
    sessionId: string
    location: VideoLocation
    startTime: number
    type: HighlightType
    downloadStatus?: DownloadStatus
}

export interface AppSettings {
    deleteAfter: number;
    customBitrate: boolean;
}

export const READY = 'READY'
export const START_REQUESTED = 'START_REQUESTED'
export const WAITING_FOR_START = 'WAITING_FOR_START'
export const RECORDING = 'RECORDING'
export const WAITING_FOR_STOP = 'WAITING_FOR_STOP'

type Ready = {
    name: typeof READY;
};

type StartRequested = {
    name: typeof START_REQUESTED;
};

type WaitingForStart = {
    name: typeof WAITING_FOR_START;
    streamId: number;
};
type Recording = {
    name: typeof RECORDING;
    streamId: number;
    startTime: number;
    events: Event[];
};

type WaitingForStop = {
    name: typeof WAITING_FOR_STOP;
    startTime: number;
    events: Event[];
};

/**
 * The recorder is a finite state machine with 5 states and 5 actions:
 *
 * STATES:
 * Ready - the recorder is ready to accept startStreaming command.
 * StartRequested - the recorder asked Overwolf to start streaming, but the streamId has not been returned yet.
 * WaitingForStart - the streamId was acquired, and Overwolf is launching the stream.
 * Recording - Overwolf launched the stream. The recorder is accepting events in this state.
 * WaitingForStop - The recorder requested Overwolf to stop recording. The recorder is still accepting events.
 *
 * ACTIONS (methods):
 * startStreaming - when recording is requested
 * stopStreaming - when stop is requested
 * onStreamIdAssigned - when stream id is returned from the recording request
 * onStartStreaming - when recording begins
 * onStopStreaming - when recording stops
 */

export type RecorderState = Ready | StartRequested | WaitingForStart | Recording | WaitingForStop;

export type FilterOptions = {
    mergeThreshold: number;
    leadUp: number;
    aftermath: number;
    deleteFullVideo: boolean;
};

export type GameEvent = {
    name: string;
    data: any;
};

export type Event = {
    name: string;
    label: string;
    time: number;
};

export type EventGroup = {
    past: number;
    future: number;
    time: number;
    events: Event[];
};

export type SessionCapture = {
    url: string;
    path: string
    startTime: number;
    endTime: number;
    events: Event[];
    filterOptions: FilterOptions;
    session: Session;
    aborted: boolean;
    groups: EventGroup[];
};

export const AutoDeletePeriod = {
  ONE_DAY: '24 hours',
  TWO_DAYS: '48 hours',
  ONE_WEEK: '1 week',
  ONE_MONTH: '1 month'
} as const

export type AutoDeletePeriod = typeof AutoDeletePeriod[keyof typeof AutoDeletePeriod]

export const Resolution = {
  HD: '1280 x 720',
  FULL_HD: '1920 x 1080',
  '480P': '640 x 480'
} as const

export type Resolution = typeof Resolution[keyof typeof Resolution]

export type RecordingSettings = {
    enable: boolean
    autoDeletePeriod: AutoDeletePeriod
    resolution: Resolution
    framerate: 30 | 60
    customBitrate: boolean
    bitrate: number
    micAudio: boolean
    micVolume: number
    gameAudio: boolean
    gameVolume: number
    recordFullEventGames: boolean
};

export type AvatarNotification = 'MANUAL' | 'START' | 'END'; 

export const VideoLocation = {
  HIGHLIGHTS: 'highlights',
  LIBRARY: 'library',
  BOTH: 'both'
} as const
  
export type VideoLocation = typeof VideoLocation[keyof typeof VideoLocation]

export type StartTrackingPayload = {
    gameId: number
}
  
export type StopTrackingResult = {
    xp: number
    isSeason: boolean | undefined
}
  
declare global {
    interface Window {
        avatar: Console
    }
}
