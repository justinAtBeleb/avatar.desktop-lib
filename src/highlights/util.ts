import { plugin } from '../plugin/AvatarPlugin'
import { db } from '../storage/db'
import { highlightsStore } from '../storage/highlights'
import { UploadStatus } from '../types'
import { logger } from '../util/logger'

const log = logger('highlights/util.ts')

export const clearFlags = async () => {
  log('Clearing flags')

  const highlights = await highlightsStore.getAll()

  const tx = db.transaction('highlights', 'readwrite')

  for (const highlight of highlights) {
    if (highlight.status == UploadStatus.UPLOADING) {
      tx.store.put({ ...highlight, status: UploadStatus.NOT_UPLOADED }, highlight.id)
    }
  }

  return tx.done
}

export const deleteUnverified = async () => {
  log('Deleting unverified videos')

  const highlights = await highlightsStore.getAll()

  const tx = db.transaction('highlights', 'readwrite')

  for (const highlight of highlights) {
    const verified = await plugin.verifyVideo(highlight.path, highlight.code)
    if (!verified) {
      tx.store.delete(highlight.id)
    }
  }
}
