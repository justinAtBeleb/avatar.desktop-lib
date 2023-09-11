import { handleRequest } from '../actions/actions'
import { config } from '../util/config'
import { logger } from '../util/logger'

const log = logger('comm/comm.ts')

const messageListener = (message: MessageEvent) => {
  log(`message ${message.data.type} from ${message.origin} received`, message.data)
  
  if (message.origin == config.frontendUrl) {
    handleRequest(message.data)
  }
}

export const enableComm = () => {
  log('enabling avatar iFrame communication')

  const iframe = document.createElement('iframe')
  iframe.setAttribute('src', `${config.frontendUrl}/comm`)
  iframe.setAttribute('id', 'avatar-comm-iframe')
  iframe.setAttribute('style', 'display: none;')

  document.body.appendChild(iframe)

  window.addEventListener('message', messageListener)
}
