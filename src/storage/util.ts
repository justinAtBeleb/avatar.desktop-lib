import { AutoDeletePeriod } from '../types'

export const writeStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const readStorage = <T>(key: string, defaultValue: T): T => {
  const value: string | null = localStorage.getItem(key)

  return value ? JSON.parse(value) : defaultValue
}

export const updateStorage = <T>(key: string, update: (_: T) => T, defaultValue: T): T => {
  const value = readStorage(key, defaultValue)

  const updated = update(value)

  writeStorage(key, update(value))

  return updated
}

export const parseAutoDeletePeriod = (period: AutoDeletePeriod): number => {
  switch(period) {
  case '24 hours': return 1000 * 60 * 60 * 24
  case '48 hours': return 1000 * 60 * 60 * 48
  case '1 week': return 1000 * 60 * 60 * 24 * 7
  case '1 month': return 1000 * 60 * 60 * 24 * 31
  default: return Infinity
  }
}
