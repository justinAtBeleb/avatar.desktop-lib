export const SUPPORTED_GAME = {
  LEAGUE_OF_LEGENDS: 5426,
  CS_GO: 7764,
  APEX_LEGENDS: 21566,
  DOTA: 7314,
  FORTNITE: 21216,
  OVERWATCH: 10844,
  PUBG: 10906,
  RAINBOW_SIX: 10826,
  ROCKET_LEAGUE: 10798,
  VALORANT: 21640,
  MINECRAFT: 8032,
  HEARTHSTONE: 9898,
  HALO: 21854,
  SPLITGATE: 21404,
  WARZONE: 21626,
  TFT: 542626
} as const

export type SUPPORTED_GAME = typeof SUPPORTED_GAME[keyof typeof SUPPORTED_GAME]

export const EVENT_GAMES: number[] = [
  SUPPORTED_GAME.LEAGUE_OF_LEGENDS,
  SUPPORTED_GAME.CS_GO,
  SUPPORTED_GAME.APEX_LEGENDS,
  SUPPORTED_GAME.DOTA,
  SUPPORTED_GAME.FORTNITE,
  SUPPORTED_GAME.OVERWATCH,
  SUPPORTED_GAME.PUBG,
  SUPPORTED_GAME.RAINBOW_SIX,
  SUPPORTED_GAME.ROCKET_LEAGUE,
  SUPPORTED_GAME.VALORANT,
  SUPPORTED_GAME.HALO,
  SUPPORTED_GAME.SPLITGATE,
  SUPPORTED_GAME.WARZONE
]

export const HOTKEYS = {
  SAVE_PLAY: 'save_play',
  BOOKMARK: 'bookmark',
} as const

export const defaultStreamSettings: overwolf.streaming.StreamSettings = {
  provider: overwolf.streaming.enums.StreamingProvider.VideoRecorder,
  settings: {
    gif_as_video: false,
    max_quota_gb: 500,
    audio: {
      mic: {
        volume: 75,
        enable: false,
      },
      game: {
        volume: 75,
        enable: true,
      },
    },
    video: {
      indication_type: overwolf.streaming.enums.IndicationType.Dot,
      indication_position: overwolf.streaming.enums.IndicationPosition.BottomLeftCorner,
      use_app_display_name: false,
      sources: [],
      auto_calc_kbps: true,
      fps: 30,
      width: 1280,
      height: 720,
      max_kbps: 6000,
      buffer_length: 20000,
      max_file_size_bytes: 53687091200, // 50 GB
      include_full_size_video: false,
      notify_dropped_frames_ratio: 0.5,
      test_drop_frames_interval: 5000,
      frame_interval: 30,
      override_overwolf_setting: true,
      disable_when_sht_not_supported: false,
      game_window_capture: {
        enable_when_available: true,
        capture_overwolf_windows: false,
      },
      keep_game_capture_on_lost_focus: true,
    },
  },
}
