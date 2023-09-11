import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KD, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/FortniteRecorder.ts')

export default class FortniteRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['kill', 'death', 'rank', 'match', 'match_info']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['kill', 'death'].includes(event.name)) this.saveEvent(event)
      else if (event.name === 'generic' && event.data === 'won') {
        this.won = true
      }
    })
  }

  public handleInfo(info: { match_info?: { rank?: number } }): void {
    log('Info', info)

    if (info?.match_info?.rank) this.rank = info.match_info.rank
  }

  protected reset() {
    super.reset()
    this.kd.kills = 0
    this.kd.deaths = 0
    this.won = false
    this.rank = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kd.kills = event?.data?.totalKills ? JSON.parse(event.data.totalKills) : this.kd.kills + 1

    if (event.name === 'death') {
      this.won = false
      setTimeout(() => {
        log('Death, stop recording', this)
      }, 5000)
    }
  }

  protected getFilterOptions(): FilterOptions {
    return {
      mergeThreshold: 5000,
      leadUp: 9000,
      aftermath: 2000,
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

    this.won && data.push({ name: 'Result', value: 'Victory Royale' })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.FORTNITE,
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
  private won = false

  private kd: KD = {
    kills: 0,
    deaths: 0,
  }
}
