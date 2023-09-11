import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { v4 as uuid } from 'uuid'
import { SUPPORTED_GAME } from '../../util/constants'
import Recorder from '../Recorder'

export default class CsgoRecorder extends Recorder {
  private requiredFeatures = ['kill', 'death', 'match_start', 'match_end', 'match_info', 'info']

  private filterOptions: FilterOptions = {
    mergeThreshold: 4000,
    leadUp: 5000,
    aftermath: 3000,
    deleteFullVideo: this.getDeleteFullVideo(),
  }

  public getRequiredFeatures(): string[] {
    return this.requiredFeatures
  }

  public handleEvents(events: GameEvent[]): void {
    events.forEach(event => {
      if (['kill', 'death', 'assist'].includes(event.name) && this.phase !== 'warmup') this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    if (info?.round?.map) this.map = info.round.map

    if (info?.round?.phase) this.phase = info.round.phase

    if (info?.player?.team === 'CT' || info?.player?.team === 'T') this.team = info.player.team

    if (info?.match_info?.game_mode && info.match_info.game_mode !== 'not_in_game') {
      this.gameMode = info.match_info.game_mode
    }

    if (
      info?.match_info?.match_outcome === 'win' ||
      info?.match_info?.match_outcome === 'lose' ||
      info?.match_info?.match_outcome === 'tie'
    ) {
      this.result = info.match_info.match_outcome
    }
  }

  protected reset() {
    super.reset()
    this.result = undefined
    this.team = undefined
    this.kda.kills = 0
    this.kda.deaths = 0
    this.kda.assists = 0
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kda.kills = event?.data?.totalKills ? JSON.parse(event.data.totalKills) : this.kda.kills + 1

    if (event.name === 'death')
      this.kda.deaths = event?.data?.count ? JSON.parse(event.data.count) : this.kda.deaths + 1

    if (event.name === 'assist')
      this.kda.assists = event?.data?.count ? JSON.parse(event.data.count) : this.kda.assists + 1
  }

  protected getFilterOptions(): FilterOptions {
    return this.filterOptions
  }

  protected getSession(): Session {
    const data: SessionData[] = []

    data.push({
      name: 'KDA',
      value: [this.kda.kills, this.kda.deaths, this.kda.assists].join('/'),
    }),

    this.map && data.push({ name: 'Map', value: this.map })
    this.team && data.push({ name: 'Team', value: this.team })
    this.gameMode && data.push({ name: 'Game mode', value: this.gameMode })
    this.result && data.push({ 
      name: 'Result', 
      value: this.result.substring(0, 1).toUpperCase() + this.result.substring(1) 
    })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.CS_GO,
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

  private result?: 'win' | 'lose' | 'tie'
  private team?: 'T' | 'CT'
  private map?: string
  private phase?: 'warmup' | 'live' | 'freezetime' | 'over'
  private gameMode?: string

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0,
  }
}
