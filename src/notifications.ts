import { logger } from './util/logger'
import type { AvatarNotification } from './types'

const listeners = []

const log = logger('notifications')

export const addNotificationListener = (handler: (notification: AvatarNotification) => void) => {
  log('Adding notification listener')
  listeners.push(handler)
}

export const sendNotification = (notification: AvatarNotification) => {
  listeners.forEach(handler => {
    try {
      handler(notification)
    } catch (e)
    {
      log('Error sending notification', e.message)
    }
    
  })
}
