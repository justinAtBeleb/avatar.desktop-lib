import { capitalize } from 'lodash'
import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KDA, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/ValorantRecorder.ts')

const agents = {
  'Clay_PC_C': 'Raze',
  'Pandemic_PC_C': 'Viper',
  'Wraith_PC_C': 'Omen',
  'Hunter_PC_C': 'Sova',
  'Thorne_PC_C': 'Sage',
  'Phoenix_PC_C': 'Phoenix',
  'Wushu_PC_C': 'Jett',
  'Gumshoe_PC_C': 'Cypher',
  'Sarge_PC_C': 'Brimstone',
  'Breach_PC_C': 'Breach',
  'Vampire_PC_C': 'Reyna',
  'Killjoy_PC_C': 'Killjoy',
  'Guide_PC_C': 'Skye',
  'Stealth_PC_C': 'Yoru',
  'Rift_PC_C': 'Astra',
  'Grenadier_PC_C': 'KAY/O',
  'Deadeye_PC_C': 'Chamber',
  'Sprinter_PC_C': 'Neon',
  'BountyHunter_PC_C': 'Fade'
}

export default class ValorantRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['agent', 'game_info', 'match_info', 'kill', 'death', 'me']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['kill', 'death'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.match_info?.team) this.team = info.match_info.team

    if (info?.match_info?.game_mode) {
      try {
        const gameMode = JSON.parse(info.match_info.game_mode)
        if (gameMode?.mode) this.mode = gameMode.mode
      } catch {
        log('Failed to parse game mode', info)
      }
    }

    if (info?.me?.agent) this.agent = info.me.agent
  }

  protected reset() {
    super.reset()
    this.kda.kills = 0
    this.kda.deaths = 0
    this.kda.assists = 0
    this.result = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'kill') this.kda.kills = event?.data ? JSON.parse(event.data) : this.kda.kills + 1

    if (event.name === 'death') this.kda.deaths = event?.data ? JSON.parse(event.data) : this.kda.deaths + 1

    if (event.name === 'assist') this.kda.assists = event?.data ? JSON.parse(event.data) : this.kda.assists + 1
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
    const data: SessionData[] = [
      {
        name: 'KDA',
        value: [this.kda.kills, this.kda.deaths, this.kda.assists].join('/'),
      },
    ]

    this.mode && data.push({
      name: 'Game mode',
      value: this.mode.split('_').map(capitalize).join(' ')
    })

    this.team && data.push({ name: 'Team', value: capitalize(this.team) })

    this.agent && agents[this.agent] && data.push({ name: 'Agent', value: agents[this.agent] })

    this.result && data.push({ name: 'Result', value: capitalize(this.result) })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.VALORANT,
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

  private agent?: string
  private team?: 'attack' | 'defense'
  private result?: 'victory' | 'draw' | 'defeat'
  private mode?: string

  private kda: KDA = {
    kills: 0,
    deaths: 0,
    assists: 0,
  }
}
