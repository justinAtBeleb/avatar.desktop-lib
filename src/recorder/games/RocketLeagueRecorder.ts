import { v4 as uuid } from 'uuid'
import { FilterOptions, GameEvent, Session, SessionData } from '../../types'
import { SUPPORTED_GAME } from '../../util/constants'
import { logger } from '../../util/logger'
import Recorder from '../Recorder'

const log = logger('recorder/games/RocketLeagueRecorder.ts')

export default class RocketLeagueRecorder extends Recorder {
  public getRequiredFeatures(): string[] {
    return ['stats', 'match', 'death', 'teamGoal', 'opposingTeamGoal']
  }

  public handleEvents(events: GameEvent[]): void {
    log('Events', events)

    events.forEach(event => {
      // if (event.name === 'matchStart') this.startRecording()
      // else if (event.name === 'matchEnd') this.stopRecording()
      if (['teamGoal', 'opposingTeamGoal'].includes(event.name)) this.saveEvent(event)
    })
  }

  public handleInfo(info: any): void {
    log('Info', info)

    if (info?.matchInfo?.matchType) this.matchType = info.matchInfo.matchType
    if (info?.match_info?.gameMode) this.matchType = info.match_info.gameMode
  }

  protected reset() {
    super.reset()
    this.teamGoals = 0
    this.opposingTeamGoals = 0
    this.matchType = undefined
  }

  protected saveEvent(event: GameEvent) {
    super.saveEvent(event)

    if (event.name === 'teamGoal') this.teamGoals = event.data.team_score || this.teamGoals + 1

    if (event.name === 'opposingTeamGoal') this.opposingTeamGoals = event.data.team_score || this.opposingTeamGoals + 1
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

    this.matchType && data.push({ name: 'Match type', value: this.matchType })

    data.push({
      name: 'Score',
      value: `${this.teamGoals} : ${this.opposingTeamGoals}`
    })

    return {
      id: uuid(),
      game: SUPPORTED_GAME.ROCKET_LEAGUE,
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

  private matchType?: string
  private teamGoals = 0
  private opposingTeamGoals = 0
}
