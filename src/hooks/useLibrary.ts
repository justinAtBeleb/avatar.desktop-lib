import { useEffect, useState } from 'react'
import { AvatarInternalEvent } from '../events'
import { libraryStore } from '../storage/library'
import { Highlight } from '../types'

export const useLibrary = (): Highlight[] | null => {
  const [library, setLibrary] = useState<Highlight[]>(null)

  const [bc] = useState(new BroadcastChannel('avatar-lib-bc'))

  useEffect(() => {
    libraryStore.getAll().then(setLibrary)
  }, [])

  useEffect(() => {
    bc.onmessage = async (message: MessageEvent<AvatarInternalEvent>) => {
      if (message.data.type == 'LIBRARY_UPDATE') {
        libraryStore.getAll().then(setLibrary)
      }
    }
  }, [bc])

  return library
}
