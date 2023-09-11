import { capitalize } from 'lodash'
import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KD, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/PubgRecorder.ts')

export default class PubgRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['kill', 'death', 'match', 'rank']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['kill', 'death'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.match_info?.me) this.rank = info.match_info.me

    if (info?.match_info?.mode) this.mode = info.match_info.mode
  }

  protected reset() {
    super.reset()
    this.kd.kills = 0
    this.kd.deaths = 0
    this.rank = undefined
    this.mode = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kd.kills = event?.data?.totalKills ? JSON.parse(event.data.totalKills) : this.kd.kills + 1

    if (event.name === 'death') this.kd.deaths = 1
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

    this.rank && data.push({ name: 'Rank', value: this.rank })

    this.mode && data.push({ name: 'Mode', value: capitalize(this.mode) })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.PUBG,
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

  private rank?: number
  private mode?: string

  private kd: KD = {
    kills: 0,
    deaths: 0,
  }
}
