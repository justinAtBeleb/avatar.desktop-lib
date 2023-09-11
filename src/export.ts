import { logger } from './util/logger'
import { plugin } from './plugin/AvatarPlugin'

const log = logger('export')

export function exportVideo(inputFilePath: string, outputName: string) {
  log(`Exporting ${inputFilePath} to ${outputName}.`)

  return new Promise<string>((resolve, reject) => {
    overwolf.utils.openFolderPicker('', result => {
      if (result.success && result.path) {
        plugin.addWatermark(inputFilePath)
          .then(withWatermark => {
            plugin.moveVideo(withWatermark, result.path, outputName).then(resolve).catch(reject)
          })
          .catch(error => {
            reject('Failed to export video:' + error)
          })
      } else {
        reject(new Error('Failed to locate the output directory.'))
      }
    })
  })
}
