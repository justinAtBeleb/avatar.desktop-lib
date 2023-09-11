import { capitalize } from 'lodash'
import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/DotaRecorder.ts')

export default class DotaRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return [
      'game_state_changed',
      'match_state_changed',
      'kill',
      'death',
      'assist',
      'match_ended',
      'game_mode',
      'me',
      'game',
    ]
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (event.name === 'game_state_changed') {
        const data = event.data

        if (data?.player_team) this.team = data.player_team
      } else if (event.name === 'match_ended') {
        const data = JSON.parse(event.data)

        if (data?.winner) this.winner = data.winner

      } else if (['kill', 'death', 'assist'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.me?.team) this.team = info.me.team

    if (info?.me?.hero) this.hero = info.me.hero
  }

  protected reset() {
    super.reset()
    this.hero = undefined
    this.team = undefined
    this.winner = undefined
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
    return {
      mergeThreshold: 5000,
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
    }),

    this.team && data.push({ name: 'Team', value: capitalize(this.team) })

    this.hero && data.push({ 
      name: 'Hero',
      value: this.hero.split('/').map(capitalize).join(' ')
    })

    this.team && this.winner && data.push({ 
      name: 'Result',
      value: this.winner == this.team ? 'Victory' : 'Defeat'
    })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.DOTA,
      gameTitle: this.gameTitle,
      date: Date.now(),
      plays: [],
      bookmarks: [],
      data: [],
      events: true,
      code: '',
      length: 0
    }
  }

  private winner?: 'radiant' | 'dire'
  private team?: 'radiant' | 'dire'
  private hero?: string

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0,
  }
}
