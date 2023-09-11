import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/HaloRecorder.ts')

export default class HaloRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['kill', 'death', 'assist', 'match_info']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['kill', 'death', 'assist'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: { match_info?: { rank?: number } }): void {
    log('Info', info)

    // TODO GAME TYPE, GAME MODE
  }

  protected reset() {
    super.reset()
    this.kda.kills = 0
    this.kda.deaths = 0
    this.kda.assists = 0
    // this.gameMode = undefined
    // this.gameType = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kda.kills ++

    if (event.name === 'death') {
      this.kda.deaths ++
    }

    if (event.name === 'assist') {
      this.kda.assists ++
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
      name: 'KDA',
      value: [this.kda.kills, this.kda.deaths, this.kda.assists].join('/'),
    })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.HALO,
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

  // private gameType?: string
  // private gameMode?: string

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0
  }
}
