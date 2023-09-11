import { capitalize } from 'lodash'
import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/Splitgate.ts')

export default class SplitgateRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['kill', 'death', 'assist', 'match']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['kill', 'death', 'assist'].includes(event.name)) { 
        this.saveEvent(event)
      }

      else if (event.name === 'matchOutcome' && ['won', 'lost', 'draw'].includes(event.data)) {
        this.result = event.data
      }
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.match_info?.mapName) this.map = info.match_info.mapName
  }

  protected reset() {
    super.reset()
    this.kda.kills = 0
    this.kda.deaths = 0
    this.kda.assists = 0
    this.result = undefined
    this.map = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kda.kills ++

    if (event.name === 'death')
      this.kda.deaths ++ 

    if (event.name === 'assists')
      this.kda.assists ++ 
  
  }

  protected getFilterOptions(): FilterOptions {
    return {
      mergeThreshold: 20000,
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

    this.map && data.push({ name: 'Rank', value: this.map })

    this.result && data.push({ name: 'Result', value: capitalize(this.result) })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.SPLITGATE,
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

  private map?: string
  private result?: 'won' | 'lost' | 'draw'

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0
  }
}
