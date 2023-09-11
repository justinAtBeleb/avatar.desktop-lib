import  * as settingsStore from '../storage/settings'
import { clearFlags, deleteUnverified } from '../highlights/util'
import { GameEvent } from '../types'
import { SUPPORTED_GAME } from '../util/constants'
import { logger } from '../util/logger'
import FullGameRecorder from './FullGameRecorder'
import ApexLegendsRecorder from './games/ApexRecorder'
import CsgoRecorder from './games/CsgoRecorder'
import DotaRecorder from './games/DotaRecorder'
import FortniteRecorder from './games/FortniteRecorder'
import HaloRecorder from './games/HaloRecorder'
import LolRecorder from './games/LolRecorder'
import OverwatchRecorder from './games/OverwatchRecorder'
import PubgRecorder from './games/PubgRecorder'
import RainbowSixRecorder from './games/RainbowSixRecorder'
import RocketLeagueRecorder from './games/RocketLeagueRecorder'
import SplitgateRecorder from './games/SplitgateRecorder'
import ValorantRecorder from './games/ValorantRecorder'
import Recorder from './Recorder'
import { initDB } from '../storage/db'
import { sessionsStore } from '../storage/sessions'
import { defaultRecordingSettings, VERSION } from '../util/config'
import WarzoneRecorder from './games/WarzoneRecorder'

const log = logger('recorder/service.ts')

let recorder: Recorder | null = null
let recording = false
const waitingRecorders: Recorder[] = []

// const setFeatures = (features: string[], retries: number) => {
//   if (retries == 0) {
//     log('Retry limit reached for setting features', null)
//   }

//   log('Setting features', features)
//   overwolf.games.events.setRequiredFeatures(features, result => {
//     log('Set features result', result)
//     if (!result.success) {
//       setTimeout(() => setFeatures(features, retries - 1), 1000)
//     }
//   })
// }

const gameToRecorder = (gameId: number) => {
  switch (gameId) {
  case SUPPORTED_GAME.LEAGUE_OF_LEGENDS:
    return new LolRecorder()
  case SUPPORTED_GAME.CS_GO:
    return new CsgoRecorder()
  case SUPPORTED_GAME.APEX_LEGENDS:
    return new ApexLegendsRecorder()
  case SUPPORTED_GAME.DOTA:
    return new DotaRecorder()
  case SUPPORTED_GAME.FORTNITE:
    return new FortniteRecorder()
  case SUPPORTED_GAME.OVERWATCH:
    return new OverwatchRecorder()
  case SUPPORTED_GAME.PUBG:
    return new PubgRecorder()
  case SUPPORTED_GAME.RAINBOW_SIX:
    return new RainbowSixRecorder()
  case SUPPORTED_GAME.ROCKET_LEAGUE:
    return new RocketLeagueRecorder()
  case SUPPORTED_GAME.VALORANT:
    return new ValorantRecorder()
  case SUPPORTED_GAME.HALO:
    return new HaloRecorder()
  case SUPPORTED_GAME.SPLITGATE:
    return new SplitgateRecorder()
  case SUPPORTED_GAME.WARZONE:
    return new WarzoneRecorder()
  case SUPPORTED_GAME.MINECRAFT:
  case SUPPORTED_GAME.HEARTHSTONE:
    return new FullGameRecorder(gameId)
  default:
    return new FullGameRecorder(gameId)
  }
}

const handleEvents = ({ events }: overwolf.games.events.NewGameEvents) => {
  log('Events received', events)

  if (!events || events.length === 0) return

  const parsedEvents: GameEvent[] = events.map(event => ({
    ...event,
    data: event.data ? JSON.parse(event.data) : {},
  }))

  recorder?.handleEvents(parsedEvents)
}

const handleInfo = (infoUpdateEvent: overwolf.games.events.InfoUpdates2Event) => {
  log('Info received', infoUpdateEvent)

  if (infoUpdateEvent && infoUpdateEvent.info) recorder?.handleInfo(infoUpdateEvent.info)
}

const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
  log('Hotkey pressed', event)
  recorder?.handleHotkey(event)
}

const onStartRecording = (event: overwolf.streaming.StreamEvent) => {
  log('onStartRecording', recorder)
  recorder?.onStartRecording(event)
}

const onStopRecording = (response: overwolf.streaming.StopStreamingEvent) => {
  recorder?.onStopRecording(response)

  waitingRecorders.forEach(rec => rec.onStopRecording(response))

  waitingRecorders.length = 0 // clear array
}

const onGameInfoReceived = (info: overwolf.games.GetRunningGameInfoResult) => {
  log('onGameInfoReceived', info)
  if (!info) return

  recorder.setGameTitle(info.title)
}

const addListeners = () => {
  log('Adding listeners', null)

  overwolf.streaming.onStartStreaming.addListener(onStartRecording)
  overwolf.streaming.onStopStreaming.addListener(onStopRecording)

  overwolf.settings.hotkeys.onPressed.addListener(handleHotkey)

  overwolf.games.events.onNewEvents.addListener(handleEvents)
  overwolf.games.events.onInfoUpdates2.addListener(handleInfo)
}

export const initRecording = async () => {
  log(`Initializing Avatar library v${VERSION}.`)
  
  await initDB()

  let settings = settingsStore.readSettings()

  if (!settings) {
    log('No settings found, creating default settings.')
    settingsStore.updateSettings(defaultRecordingSettings)
    settings = defaultRecordingSettings
  }

  await sessionsStore.deleteOld(settings.autoDeletePeriod)
  await clearFlags()
  await deleteUnverified()

  addListeners()
}

/**
 * This methods starts the recording manager, preferably called when a game is launched.
 * Creates a recorder for that game and starts a session on it.
 * @param gameId The game that is running.
 */
export const startRecording = (gameId: number) => {
  const settings = settingsStore.readSettings()

  if (!settings.enable) {
    log('Recording is disabled.')
    return
  }

  if (recording) {
    log('Already recording')
    return
  }

  recording = true
  
  recorder = gameToRecorder(gameId)
  overwolf.games.getRunningGameInfo(onGameInfoReceived)

  if (!recorder) {
    log(`Recorder for ${gameId} does not exist.`, null)
    return
  }

  log('Initialized recorder', recorder)

  // if (EVENT_GAMES.includes(gameId)) {
  //   setFeatures(recorder.getRequiredFeatures(), 100)
  // }

  recorder.startSession()
}

/**
 * Stops the recording manager, preferably when a game stops, or some unexpected event happens.
 * Stops the current recorder. If the recorder is still recording and is waiting for termination,
 * place it in a waiting list. All waiting recorders will have their onStopRecording method called
 * when the streaming stops.
 */
export const stopRecording = () => {
  if (!recorder) {
    log('No recorder is present.')
    return
  }

  if (!recording) {
    log('Not recording. Can\'t stop')
  }

  recording = false

  const waiting = recorder.stopSession()

  if (waiting) waitingRecorders.push(recorder)

  recorder = null
}
