import axios from 'axios'
import { zipObject } from 'lodash'
import { plugin } from './plugin/AvatarPlugin'
import { config } from './util/config'
import { logger } from './util/logger'
import { createFileFromUrl } from './util/common'
import type { Highlight } from './types'

const log = logger('upload')

export const upload = async (highlight: Highlight, token: string) => {
  if (!highlight.code) {
    throw new Error('Failed to upload. No code.')
  }

  const verified = await plugin.verifyVideo(highlight.path, highlight.code)

  if (!verified) {
    throw new Error('Failed to upload. Invalid code')
  }

  const files = await plugin.convertToHLS(highlight.url, highlight.path)
  const paths = files.map(f => f.path)
  const names = paths.map(p => new URL(p).pathname.split('/').pop() as string)

  const codes = await plugin.signVideos(paths)

  const fileCodes = zipObject(names, codes)

  const code = await plugin.signString(JSON.stringify(fileCodes))

  const formData = new FormData()

  for (const file of files) {
    const obj = await createFileFromUrl(file.url)
    formData.append('files', obj, obj.name)
  }

  formData.append('fileCodes', JSON.stringify(fileCodes))
  formData.append('code', code)
  formData.append('title', highlight.title)
  formData.append('postTags', JSON.stringify(highlight.tags))
  formData.append('gameId', highlight.game.toString())
  formData.append('highlightType', highlight.type)
  formData.append('videoLength', highlight.length.toString())

  return axios.post(config.uploadUrl, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    onUploadProgress: (p: any) => {
      log(p)
    },
  })
}
