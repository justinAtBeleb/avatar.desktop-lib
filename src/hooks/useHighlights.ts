import { useEffect, useState } from 'react'
import { AvatarInternalEvent } from '../events'
import { sessionsStore } from '../storage/sessions'
import { Session } from '../types'

export const useHighlights = (): Session[] | null => {
  const [highlights, setHighlights] = useState<Session[]>(null)

  const [bc] = useState(new BroadcastChannel('avatar-lib-bc'))

  useEffect(() => {
    sessionsStore.getAll().then(setHighlights)
  }, [])

  useEffect(() => {
    bc.onmessage = async (message: MessageEvent<AvatarInternalEvent>) => {
      if (message.data.type == 'HIGHLIGHTS_UPDATE') {
        sessionsStore.getAll().then(setHighlights)
      }
    }
  }, [bc])

  return highlights
}
