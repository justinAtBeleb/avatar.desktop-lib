import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/ApexRecorder.ts')

export default class ApexLegendsRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['kill', 'death', 'match_info', 'match_state', 'rank', 'match_summary']
  }

  public handleEvents(events: GameEvent[]): void {
    events.forEach(event => {
      if (['kill', 'death'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    if (info?.match_info?.game_mode) this.gameMode = info.match_info.game_mode

    if (info?.match_info?.victory) this.victory = info.match_info.victory

    if (info?.match_info?.match_summary) {
      try {
        const rank = JSON.parse(info.match_info.match_summary).rank
        if (rank) this.rank = rank
      } catch {
        log('Failed to parse match summary', info)
      }
    }
  }

  protected reset() {
    super.reset()
    this.kda.kills = 0
    this.kda.deaths = 0
    this.kda.assists = 0
    this.victory = undefined
    this.rank = undefined
    this.gameMode = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kda.kills = event?.data?.totalKills ? JSON.parse(event.data.totalKills) : this.kda.kills + 1

    if (event.name === 'death') this.kda.deaths = 1

    if (event.name === 'assist')
      this.kda.assists = event?.data?.count ? JSON.parse(event.data.count) : this.kda.assists + 1
  }

  protected getFilterOptions(): FilterOptions {

    return {
      mergeThreshold: 2000,
      leadUp: 9000,
      aftermath: 2000,
      deleteFullVideo: this.getDeleteFullVideo()
    }
  }

  protected getSession(): Session {
    const data: SessionData[] = []

    this.gameMode && data.push({
      name: 'Game mode',
      value: this.gameMode
    })

    data.push({
      name: 'KDA',
      value: [this.kda.kills, this.kda.deaths, this.kda.assists].join('/'),
    })

    this.rank && data.push({
      name: 'Result',
      value: this.rank
    })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.APEX_LEGENDS,
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

  private victory?: 'true' | 'false'
  private rank?: number
  private gameMode?: string

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0,
  }
}
