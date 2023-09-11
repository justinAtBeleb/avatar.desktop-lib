import { processGameSession } from '../highlights/highlights'
import { sendNotification } from '../notifications'
import { readSettings } from '../storage/settings'
import { Bookmark, FilterOptions, GameEvent, READY, RecorderState, RECORDING, Session, 
  START_REQUESTED, WAITING_FOR_START, WAITING_FOR_STOP } from '../types'
import { HOTKEYS } from '../util/constants'
import { logger } from '../util/logger'
import { requestRecording } from './helpers'

const log = logger('recorder/games/Recorder.ts')

type StopStreamingEvent = overwolf.streaming.StopStreamingEvent;

/**
 * The game recorder. Handles when to start and stop recording video, saves events and creates highlights.
 */
export default abstract class Recorder {
  /**
     * Starts a session on this recorder. 
  */
  public startSession() {
    this.startRecording()
  }

  /**
     * Stops the current recording session.
     *
     * @return Returns true if this recorder is waiting for an 'onStopStreaming' event, false otherwise.
     * If waiting, the caller should call the onStopRecording method of this recorder, when the streaming is stopped.
     */
  public stopSession(): boolean {
    const recording = this.state.name === RECORDING

    if (recording) this.stopRecording()

    return recording
  }

    public abstract getRequiredFeatures(): string[];

    public abstract handleEvents(events: GameEvent[]): void;

    public abstract handleInfo(info: any): void;

    public handleHotkey(event: overwolf.settings.hotkeys.OnPressedEvent): void {
      if (event.name === HOTKEYS.SAVE_PLAY) {
        this.saveEvent({ name: 'manual', data: { label: '' } })
        sendNotification('MANUAL')
      }
      
      if (event.name === 'bookmark') {
        log('Placing bookmark', this)
        this.bookmarks.push({ time: performance.now() })
      }
    }

    /**
     * This method should be called when Overwolf starts recording video.
     * @param streamEvent the event returned from Overwolf streaming API.
     */
    public onStartRecording(streamEvent: overwolf.streaming.StreamEvent) {
      log('onStartRecording', { streamEvent, this: this })

      switch (this.state.name) {
      case READY:
        log(
          'This recorder did not request recording, but his onStartRecording method was called',
          this,
        )
        break

      case START_REQUESTED:
        log('onStartRecording called while the id was not assigned.', this)

        if (streamEvent.stream_id) {
          log('Using this stream ID', streamEvent.stream_id)
          this.state = {
            name: RECORDING,
            streamId: streamEvent.stream_id,
            startTime: performance.now(),
            events: [],
          }
        } else {
          log('No stream ID present, resetting recorder to READY state.', null)
          this.state = { name: READY }
        }
        break

      case WAITING_FOR_START:
        this.state = {
          name: RECORDING,
          streamId: this.state.streamId,
          startTime: performance.now(),
          events: [],
        }
        log('Recording started', this)
        sendNotification('START')
        break

      case RECORDING:
        log('This recorder is already recording', this)
        break

      case WAITING_FOR_STOP:
        log(
          'This recorder did not request recording, but his onStartRecording method was called',
          this,
        )
        break
      }
    }

    public onStopRecording = (response: StopStreamingEvent) => {
      log('onStopRecording', this)

      switch (this.state.name) {
      case READY:
      case START_REQUESTED:
      case WAITING_FOR_START:
        log(
          'This recorder did not request recording termination, but his onStopRecording method was called',
          this,
        )
        break
          
      case RECORDING:
      case WAITING_FOR_STOP:
        sendNotification('END')
        processGameSession({
          url: response.url,
          path: response.file_path,
          startTime: this.state.startTime,
          endTime: performance.now(),
          events: this.state.events,
          aborted: this.aborted,
          filterOptions: this.getFilterOptions(),
          session: this.getSession(),
          groups: [],
        })
        this.state = { name: READY }
        break
      }
    }

    protected aborted = false

    protected abstract getFilterOptions(): FilterOptions;

    private startRecording() {
      log('Start recording', this.state)

      switch (this.state.name) {
      case READY:
        this.reset()

        this.state = { name: START_REQUESTED }

        requestRecording()
          .then(this.onStreamIdAssigned.bind(this))
          .catch(response => {

            this.state = { name: READY }
            log('Failed to start recording, retrying in 10 seconds.', {
              this: this,
              error: response,
            })
            setTimeout(this.startRecording.bind(this), 10000)
          })
        break

      case START_REQUESTED:
        log('Recording has already been requested.', this)
        break

      case WAITING_FOR_START:
        log('Recorder is already waiting for start.', this)
        break

      case RECORDING:
        log('Recording is already in progress', this)
        break

      case WAITING_FOR_STOP:
        log('Wait for stop interrupted by start, retrying recording in 3 seconds.', this)
        setTimeout(this.startRecording.bind(this), 3000)
        break
      }
    }

    private stopRecording() {
      log('Stop recording', this.state)

      switch (this.state.name) {
      case READY:
        log('This recorder is not running', this)
        break

      case START_REQUESTED:
      case WAITING_FOR_START:
        log('Wait for start interrupted by stop, aborting and stopping 5 seconds.', this)
        this.aborted = true
        setTimeout(this.stopRecording.bind(this), 5000)
        break

      case RECORDING:
        overwolf.streaming.stop(this.state.streamId, response => {
          log('Streaming stop requested', response)
        })
        this.state = {
          name: WAITING_FOR_STOP,
          startTime: this.state.startTime,
          events: this.state.events,
        }

        break

      case WAITING_FOR_STOP:
        log('Already waiting for stop.', this)
        break
      }
    }

    protected abstract getSession(): Session;

    protected abort() {
      log('abort', null)
      this.aborted = true
      this.stopRecording()
    }

    protected saveEvent(event: GameEvent) {
      log('saveEvent', { state: this.state, event })
      switch (this.state.name) {
      case RECORDING:
      case WAITING_FOR_STOP:
        this.state.events.push({
          name: event.name,
          label: event.data.label,
          time: performance.now(),
        })
        break

      default:
        log('Cannot save events in this state', this)
      }
    }

    protected reset(): void {
      this.aborted = false
      this.bookmarks = []
    }

    protected state: RecorderState = { name: READY }

    protected bookmarks: Bookmark[] = []

    private onStreamIdAssigned(streamId: number) {
      this.state = {
        name: WAITING_FOR_START,
        streamId,
      }
    }

    protected getDeleteFullVideo(): boolean {
      const settings = readSettings()
      return !(settings.recordFullEventGames)
    }

    protected gameTitle: string

    public setGameTitle(gameTitle: string) {
      this.gameTitle = gameTitle
    }
}
