const log = (windowName: string, source: string, message: string, payload?: any) => {
  const output = window.avatar || console
  
  output.log(`[LOG][AVATAR-LIB][${windowName}][${new Date().toLocaleString()}][${source}]: ${message}`)
      
  if (payload) {
    output.log(JSON.stringify(payload))
  }
}

export const logger = (source: string) => (message: string, payload?: any) => {
  if (window?.overwolf?.windows?.getCurrentWindow) {
    overwolf.windows.getCurrentWindow(result => {
      log(result.window.name, source, message, payload)
    })
  } else {
    log('unknown window', source, message, payload)
  }
}
