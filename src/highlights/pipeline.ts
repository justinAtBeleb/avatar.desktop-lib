import { logger } from '../util/logger'

const log = logger('highlights/pipeline.ts')

export type Pipe<T> = (_: T) => T | false | Promise<T | false>;

export type Step<T> = {
    name: string;
    fn: Pipe<T>;
};

export const runPipeline = async <T>(initial: T, steps: Step<T>[]) => {
  let state = initial

  for (const step of steps) {
    log(`Running step ${step.name} with data:`, state)

    try {
      const result = await step.fn(state)

      if (!result) {
        log('Aborting pipeline.')
        break
      }

      state = result
    } catch (e) {
      log(`Pipeline failed at ${step.name}`, e.message)
      break
    }
  }
}
