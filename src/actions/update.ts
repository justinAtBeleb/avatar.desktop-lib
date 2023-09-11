import { highlightsStore } from '../storage/highlights'

export const updateTitle = async (highlightId: string, newTitle: string) => {
  await highlightsStore.setTitle(highlightId, newTitle)
}
