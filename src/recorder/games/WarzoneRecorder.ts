import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KD, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/WarzoneRecorder.ts')

const modes = {
  1: 'lobby',
  140: 'solo/duo/quads',
  139: 'trio',
  24: 'training'
}

export default class WarzoneRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['kill', 'death', 'match_info', 'game_info']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['kill', 'death'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.match_info?.game_mode) this.gameMode = modes[info.match_info.game_mode]

    if (info?.match_info?.game_map) this.map = info.match_info.game_map

  }

  protected reset() {
    super.reset()
    this.kd.kills = 0
    this.kd.deaths = 0
    this.gameMode = undefined
    this.map = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kd.kills ++

    if (event.name === 'death') {
      this.kd.deaths ++
    }
  }

  protected getFilterOptions(): FilterOptions {
    return {
      mergeThreshold: 4000,
      leadUp: 9000,
      aftermath: 3000,
      deleteFullVideo: this.getDeleteFullVideo(),
    }
  }

  protected getSession(): Session {
    const data: SessionData[] = []

    data.push({
      name: 'KD',
      value: [this.kd.kills, this.kd.deaths].join('/'),
    })

    this.gameMode && data.push({ name: 'Game mode', value: this.gameMode })

    this.map && data.push({ name: 'Map', value: this.map })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.WARZONE,
      gameTitle: this.gameTitle,
      date: Date.now(),
      plays: [],
      bookmarks: [],
      data,
      events: true,
      code: '',
      length: 0
    }
  }

  private gameMode?: string
  private map?: string

  private kd: KD = {
    kills: 0,
    deaths: 0,
  }
}
