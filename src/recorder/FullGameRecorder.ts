import { v4 as uuid } from 'uuid'
import { FilterOptions, Session } from '../types'
import { logger } from '../util/logger'
import Recorder from './Recorder'

const log = logger('recorder/FullGameRecorder.ts')

export default class FullGameRecorder extends Recorder {
  public game: number

  constructor(game: number) {
    super()
    this.game = game
    this.bookmarks = []
  }

  public getRequiredFeatures(): string[] {
    return []
  }
  public handleEvents(): void {
    log('Full game recorder does not handle events', null)
    return
  }
  public handleInfo(): void {
    log('Full game recorder does not handle info', null)
  }

  public handleHotkey(event: overwolf.settings.hotkeys.OnPressedEvent): void {
    super.handleHotkey(event)
  }

  protected getFilterOptions(): FilterOptions {
    return { mergeThreshold: 5000, leadUp: 10000, aftermath: 2000, deleteFullVideo: false }
  }

  protected getSession(): Session {
    return {
      id: uuid(),
      game: this.game,
      gameTitle: this.gameTitle,
      bookmarks: this.bookmarks,
      date: Date.now(),
      plays: [],
      data: [],
      events: false,
      code: '',
      length: 0
    }
  }

  protected reset() {
    super.reset()
    this.bookmarks = []
  }
}
