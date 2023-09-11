import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { v4 as uuid } from 'uuid'
import { SUPPORTED_GAME } from '../../util/constants'
import Recorder from '../Recorder'

export default class LolRecorder extends Recorder {
  private requiredFeatures = [
    'kill',
    'death',
    'assist',
    'match_info',
    'summoner_info',
    'announcer',
  ]

  private filterOptions: FilterOptions = {
    mergeThreshold: 5000,
    leadUp: 9000,
    aftermath: 3000,
    deleteFullVideo: true,
  }

  public getRequiredFeatures(): string[] {
    return this.requiredFeatures
  }

  public handleEvents(events: GameEvent[]): void {
    events.forEach(event => {
      if (['kill', 'death', 'assist'].includes(event.name)) {
        this.saveEvent(event)
      }

      if (['announcer'].includes(event.name)) {
        if (event.data.name === 'victory') {
          this.result = 'Victory'
        } else if (event.data.name === 'defeat') {
          this.result = 'Defeat'
        }
      }
    })
  }

  public handleInfo(info: any) {
    if (info?.match_info?.game_mode && 
        typeof info.match_info.game_mode == 'string' && 
        info.match_info.game_mode.toLowerCase() == 'tft'
    ) {
      this.isTFT = true
    }

    if (info?.summoner_info?.champion) {
      if (info.summoner_info.champion === 'TFTChampion') {
        this.isTFT = true
      } else {
        this.champion = info.summoner_info.champion
      }
    }
  }

  protected reset() {
    super.reset()
    this.result = undefined
    this.champion = undefined
    this.kda.kills = 0
    this.kda.deaths = 0
    this.kda.assists = 0
    this.isTFT = false
  }

  protected saveEvent(event: any) {
    super.saveEvent(event)

    if (event.name === 'kill')
      this.kda.kills = event?.data?.totalKills
        ? JSON.parse(event.data.totalKills)
        : this.kda.kills + 1

    if (event.name === 'death')
      this.kda.deaths = event?.data?.count
        ? JSON.parse(event.data.count)
        : this.kda.deaths + 1

    if (event.name === 'assist')
      this.kda.assists = event?.data?.count
        ? JSON.parse(event.data.count)
        : this.kda.assists + 1
  }

  protected getFilterOptions(): FilterOptions {
    return {
      ... this.filterOptions,
      deleteFullVideo: this.getDeleteFullVideo() && !this.isTFT
    }
  }

  protected getSession(): Session {
    if (this.isTFT) {
      return {
        id: uuid(),
        game: SUPPORTED_GAME.TFT,
        gameTitle: 'Teamfight Tactics',
        date: Date.now(),
        data: [],
        plays: [],
        bookmarks: this.bookmarks,
        code: '',
        events: false,
        length: 0
      }
    } else { // regular LoL
      const data: SessionData[] = [
        {
          name: 'KDA',
          value: [this.kda.kills, this.kda.deaths, this.kda.assists].join('/'),
        },
      ]

      if (this.champion) {
        data.push({ name: 'Champion', value: this.champion })
      }

      if (this.result) {
        data.push({ name: 'Result', value: this.result })
      }

      return {
        id: uuid(),
        game: SUPPORTED_GAME.LEAGUE_OF_LEGENDS,
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
  }

  private result?: 'Victory' | 'Defeat'

  private champion?: string

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0,
  }

  private isTFT = false
}
