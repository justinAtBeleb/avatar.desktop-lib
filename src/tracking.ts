import { sendEvent } from './events/events'
import { startRecording, stopRecording } from './recorder/service'
import { enableXpTracking, startXpTracking, stopXpTracking } from './xp'
import type { StartTrackingPayload, StopTrackingResult } from './types'
import { logger } from './util/logger'

let enabled = false
export let tracking = false

const log = logger('tracking')

export const startAvatarTracking = (payload: StartTrackingPayload) => {
  tracking = true
  
  enableTracking()
  startXpTracking(payload.gameId)
  startRecording(payload.gameId)
}

export const stopAvatarTracking = async (): Promise<StopTrackingResult> => {
  log('stopping XP tracking (game end)')
  tracking = false

  const endTrackingData = await stopXpTracking()
  sendEvent({ type: 'GAME_END' })
  
  stopRecording()
  return endTrackingData
}

// initializes the tracking (doesn't turn on the tracking)
export const enableTracking = () => {
  if (enabled) return log('tracking already enabled while enabling tracking, returning')
  log('enabling tracking (not starting)')

  enabled = true
  enableXpTracking()

  // setInterval(() => {
  //   if (!tracking) {
  //     overwolf.games.getRunningGameInfo2(result => {
  //       if (!result.success) {
  //         log('Failed to get running game info', JSON.stringify(result))
  //       }

  //       if (!result.gameInfo) {
  //         return
  //       }

  //       if (result.gameInfo.isRunning && !tracking) {
  //         // game is running
  //         log('Force start tracking', result.gameInfo)
  //         startXpTracking(result.gameInfo.classId)
  //       } else {
  //         // no game is running
  //       }
  //     })
  //   }
  // }, 1000 * 60)
}

export const setTracking = (val: boolean) => tracking = val
