import { capitalize } from 'lodash'
import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KD, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/RainbowSixRecorder.ts')

type Score = {
  orange: number
  blue: number
}

export default class RainbowSixRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['game_info', 'match_info', 'match', 'kill', 'death', 'roster']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (event.name === 'kill') this.kd.kills += 1
      if (event.name === 'death') this.kd.deaths += 1

      if (['kill', 'death'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.match_info?.game_mode) this.gameMode = info.match_info.game_mode
    if (info?.match_info?.map_id) this.map = info.match_info.map_id
  }

  protected reset() {
    super.reset()
    this.kd.kills = 0
    this.kd.deaths = 0
    this.score.orange = 0
    this.score.blue = 0
    this.map = undefined
    this.gameMode = undefined
    this.outcome = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)
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

    this.gameMode && data.push({
      name: 'Game mode',
      value: this.gameMode.split('_').join(' ')
    })

    this.map && data.push({
      name: 'Map',
      value: this.map.split(' ').map(capitalize).join(' ')
    })

    this.outcome && data.push({
      name: 'Result',
      value: capitalize(this.outcome)
    })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.RAINBOW_SIX,
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
  private outcome?: string

  private score: Score = {
    orange: 0,
    blue: 0,
  }

  private kd: KD = {
    kills: 0,
    deaths: 0,
  }
}
