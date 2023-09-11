import axios from 'axios'
import { getToken } from './token'
import { tracking } from './tracking'
import { StopTrackingResult } from './types'
import { config } from './util/config'
import { logger } from './util/logger'

const log = logger('xp')

// maximum difference between two detected activities for the time to count to the total time spent playing
const TIMEOUT = 60 // seconds

let miliseconds = 0
const hashes = new Set<string>()
let hashInterval: number | undefined
let gameId: number | undefined
let lastActiveTimestamp: number | undefined = undefined

export const enableXpTracking = () => {
  log('enabling (not starting) XP tracking')
  overwolf.games.inputTracking.onMouseDown.addListener(onActivity)
  overwolf.games.inputTracking.onKeyDown.addListener(onActivity)
}

export const startXpTracking = async (game: number) => {
  log('starting XP tracking')
  gameId = game
  hashes.add(await getHash())

  if (!hashInterval) {
    hashInterval = setInterval(async () => {
      await getHash()
    }, 1000 * 60 * 5) // 5 minutes
  }
}

export const stopXpTracking = async (): Promise<StopTrackingResult> => {
  // running onActivity on stop, to calculate remaining XP even without activity
  onActivity()
  log(
    `stopping tracking, total ${Math.floor(
      miliseconds / 1000
    )}s`
  )

  clearInterval(hashInterval)
  hashInterval = undefined

  hashes.add(await getHash())

  try {
    return recordActivity()
  } catch (e) {
    log('Failed to record activity', JSON.stringify(e))
    return { xp: 0, isSeason: undefined }
  } finally {
    gameId = undefined
    hashes.clear()
    miliseconds = 0
  }
}

const onActivity = () => {
  if (!tracking) return

  const nowTimestamp = new Date().getTime()
  if (!lastActiveTimestamp) {
    lastActiveTimestamp = nowTimestamp 
    return 
  }
    
  const diff = nowTimestamp - lastActiveTimestamp
  if (diff < TIMEOUT * 1000) {
    miliseconds += diff
  } else {
    log(`inactive (${diff}ms)`)
  }
  lastActiveTimestamp = nowTimestamp
}

const getHash = async () => {
  try {
    const response = await axios.get<string>(
      `${config.coreUrl}/v0/activity/hash`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    )
    const hash = response.data
    hashes.add(hash)
    return hash
  } catch (error) {
    log('error getting hash', error)
  }
}

const recordActivity = async (): Promise<StopTrackingResult> => {
  const response = await axios.post<StopTrackingResult>(
    `${config.coreUrl}/v0/activity`,
    {
      time: Math.floor(miliseconds / 1000),
      hashes: Array.from(hashes),
      gameId,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  )

  return response.data
}
