import { logger } from '../util/logger'

const log = logger('plugin/OwPlugin.ts')

export default class OwPlugin<T> {
  protected plugin: T | null = null

  private readonly extraObjectName: string

  constructor(extraObjectNameInManifest: string) {
    this.extraObjectName = extraObjectNameInManifest
  }

  public initialized(): boolean {
    return this.plugin != null
  }

  public initialize(callback: (_: boolean) => void): void {
    let getExtraObject = null

    try {
      getExtraObject = overwolf.extensions.current.getExtraObject
    } catch (e) {
      console.error('overwolf.extensions.current.getExtraObject doesn\'t exist!')
      return callback(false)
    }

    getExtraObject(this.extraObjectName, result => {
      if (!result.success) {
        log(`failed to create ${this.extraObjectName} object`, result)
        return callback(false)
      }

      this.plugin = result.object

      return callback(true)
    })
  }
}
