export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const createFileFromUrl = async (url: string) => {
  const response = await fetch(url)
  const data = await response.blob()
  const metadata = { type: data.type }
  const filename = url.replace(/\?.+/, '').split('/').pop() as string
  return new File([data], filename, metadata)
}
