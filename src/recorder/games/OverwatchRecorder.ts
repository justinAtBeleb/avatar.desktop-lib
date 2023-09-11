import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, KD, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/OverwatchRecorder.ts')

const mapNames: { [_: number]: string | undefined } = {
  91: 'Temple Of Anubis',
  212: 'Kingdom Kings Row',
  357: 'Hanamura',
  388: 'Watchpoint Gibraltar',
  468: 'Numbani',
  475: 'Volskaya Industries',
  687: 'Hollywood',
  707: 'Dorado',
  1207: 'Nepal',
  1467: 'Route 66',
  1633: 'Tutorial',
  1634: 'Lijiang Tower',
  1645: 'Ilios',
  1672: 'Practice Range',
  1677: 'Eichenwalde',
  1694: 'Oasis',
  1707: 'Hollywood Halloween',
  1713: 'Kingdom Kings Row Winter',
  1715: 'Estadio Das Ras',
  1717: 'Hanamura Winter',
  1719: 'Lijiang Tower Lunar New Year',
  1735: 'Vpp Green Room',
  1737: 'Junkensteins Revenge Halloween',
  1745: 'Ecopoint Antarctica',
  1747: 'Horizon Lunar Colony',
  1797: 'Necropolis',
  1804: 'Black Forest',
  1805: 'Ecopoint Antarctica Winter',
  1809: 'Lijiang Garden Lunar New Year',
  1810: 'Lijiang Night Market Lunar New Year',
  1815: 'Nepal Sanctum',
  1818: 'Lijiang Control Center Lunar New Year',
  1820: 'Castillo',
  1846: 'Nepal Village',
  1848: 'Nepal Shrine',
  1850: 'Ilios Well',
  1853: 'Ilios Lighthouse',
  1854: 'Ilios Ruins',
  1860: 'Lijiang Control Center',
  1861: 'Lijiang Garden',
  1862: 'Lijiang Night Market',
  1866: 'Oasis City Center',
  1868: 'Oasis Gardens',
  1869: 'Oasis University',
  1878: 'Junkertown',
  1886: 'Blizzard World',
  1939: 'Sydney Harbour Arena',
  1953: 'Ayutthaya',
  1956: 'Chateau Guillard',
  2018: 'Busan',
  2036: 'Eichenwalde Halloween',
  2039: 'Black Forest Winter',
  2045: 'Nepal Village Winter',
  2102: 'Chateau Guillard Halloween',
  2161: 'Rialto',
  2192: 'Petra',
  2193: 'Paris',
  2346: 'Busan Stadium',
  2628: 'Havana',
  2651: 'Blizzard World Winter',
  2682: 'Busan Sanctuary Lunar New Year',
  2694: 'Busan Downtown Lunar New Year',
  3136: 'Workshop Island',
  3140: 'Workshop Expanse',
  3144: 'Workshop Chamber',
  3280: 'Workshop Expanse Night',
  3281: 'Workshop Island Night',
}

const gameModeNames: { [_: number]: string | undefined } = {
  3: 'Junkensteins Revenge',
  7: 'Ctf',
  8: 'Meis Snowball Offensive',
  9: 'Elimination',
  15: 'Uprising',
  16: 'Skirmish',
  20: 'Assault',
  21: 'Escort',
  22: 'Hybrid',
  23: 'Control',
  25: 'Tutorial',
  26: 'Uprising All Heroes',
  29: 'Team Deathmatch',
  30: 'Deathmatch',
  32: 'Lucioball',
  37: 'Retribution',
  41: 'Yeti Hunter',
  42: 'Halloween Holdout Endless',
  61: 'Calypso Heromode',
  67: 'Storm Rising',
  74: 'Survivor',
  89: 'Snowball Deathmatch',
  90: 'Practice Range',
}

export default class OverwatchRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['game_info', 'match_info', 'kill', 'death']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      if (['elimination', 'death'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.game_info?.game_mode) {
      const gameModeNumber = parseInt(info?.game_info?.game_mode)

      if (gameModeNumber && gameModeNames[gameModeNumber]) this.gameMode = gameModeNames[gameModeNumber]
    }

    if (info?.match_info?.map) {
      const mapNumber = parseInt(info?.match_info?.map)

      if (mapNumber && mapNames[mapNumber]) this.map = mapNames[mapNumber]
    }
  }

  protected reset() {
    super.reset()
    this.kd.kills = 0
    this.kd.deaths = 0
    this.gameMode = undefined
    this.map = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'elimination') this.kd.kills = parseInt(event.data) || this.kd.kills + 1

    if (event.name === 'death') this.kd.deaths = parseInt(event.data) || this.kd.deaths + 1
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

    this.gameMode && data.push({ name: 'Mode', value: this.gameMode })
    this.map && data.push({ name: 'Map', value: this.map })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.OVERWATCH,
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

  private kd: KD = {
    kills: 0,
    deaths: 0,
  }
}
