import { logger } from '../util/logger'
import OwPlugin from './OwPlugin'

const log = logger('plugin/AvatarPlugin.ts')

type Result<T = undefined> = {
    success: boolean;
    data: T;
    error?: string;
};

type AvatarDLL = {
    Initialize: (obsDirectory: string, callback: (result: Result<string>) => void) => void;
    SignString: (str: string, callback: (result: Result<string>) => void) => void;
    SignFile: (file: string, callback: (result: Result<string>) => void) => void;
    SignFiles: (files: string[], callback: (result: Result<string[]>) => void) => void;
    VerifyFile: (file: string, code: string, callback: (result: Result<boolean>) => void) => void;
    ConvertVideo: (file: string, callback: (result: Result<string[]>) => void) => void;
    MoveFile: (
      inputFile: string, 
      outputDirectory: string, 
      name: string, 
      callback: (result: Result<string>) => void
    ) => void;
    AddWatermark: (inputFile: string, callback: (result: Result<string>) => void) => void;
};

export default class AvatarPlugin extends OwPlugin<AvatarDLL> {
  private ffmpegLoaded = false

  constructor() {
    super('avatar')

    this.initialize(success => {
      if (success) {
        log('Initialized OWPlugin')
        this.loadFFmpeg()
      } else {
        log('Failed to initialize OWPlugin.')
      }
    })
  }

  private async loadFFmpeg() {
    if (!this.plugin) throw new Error('Plugin not initialized')

    if (this.ffmpegLoaded) {
      return true
    }

    this.plugin.Initialize(overwolf.io.paths.obsBin, result => {
      if (result.success) {
        this.ffmpegLoaded = true
        log('FFmpeg loaded OK.')
      } else {
        log('Failed to load FFmpeg', result.error)
      }
    })
  }

  public signString(str: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.plugin?.SignString(str, result => {
        log('SignString result', result)

        if (result.success) {
          resolve(result.data)
        }

        reject(new Error(result.error))
      })
    })
  }

  public signVideo(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.plugin?.SignFile(url, result => {
        log('SignFile result', result)

        if (result.success) {
          resolve(result.data)
        }

        reject(new Error(result.error))
      })
    })
  }

  public signVideos(urls: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.plugin?.SignFiles(urls, result => {
        log('SignFiles result', result)

        if (result.success) {
          resolve(result.data)
        }

        reject(new Error(result.error))
      })
    })
  }

  public verifyVideo(url: string, code: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.plugin?.VerifyFile(url, code, result => {
        if (result.success) {
          resolve(result.data)
        }

        reject(new Error(result.error))
      })
    })
  }

  public convertToHLS(url: string, path: string): Promise<{ path: string; url: string }[]> {
    log('Converting video: ', path)
    return new Promise((resolve, reject) => {
      this.plugin.ConvertVideo(path, result => {
        log('Convert video result: ', result)
        if (result.success) {
          const videos = result.data.map(filePath => {
            const fileName = new URL(filePath).pathname.split('/').pop()
            const fileUrl = url.replace('.mp4', `/${fileName}`)

            return { path: filePath, url: fileUrl }
          })

          resolve(videos)
        }

        reject(new Error('Failed to convert video. '+ result.error))
      })
    })
  }

  public moveVideo(inputFilePath: string, outputDirectory: string, name: string): Promise<string> {
    log('Copying video', { inputFilePath })

    return new Promise((resolve, reject) => {
      this.plugin.MoveFile(inputFilePath, outputDirectory, name, result => {
        log('Copy file result:', result)
        if (result.success) {
          resolve(result.data)
        } else {
          reject(new Error(result.error))
        }
      })
    })
  }

  public addWatermark(intputFile: string): Promise<string> {
    log('Adding watermark')

    return new Promise((resolve, reject) => {
      this.plugin.AddWatermark(intputFile, result => {
        log('Watermark result: ', result)
        if (result.success) {
          resolve(result.data)
        } else {
          reject(new Error(result.error))
        }
      })
    })
  }

}

const plugin = new AvatarPlugin()

export { plugin }
