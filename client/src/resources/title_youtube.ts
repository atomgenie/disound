import ytsearch from "ytsr"
import { getBasicInfo } from "ytdl-core"
import { chunk } from "lodash"
import ytplaylist from "ytpl"

interface TitleInfo {
  title: string
  url: string
}

export class TitleYoutubeResource {
  private titleMap = new Map<string, TitleInfo>()

  public async getTitle(url: string): Promise<{ title: string; url: string }> {
    let resolved = this.titleMap.get(url)

    if (resolved) {
      return resolved
    }

    const info = await getBasicInfo(url)
    const resolvedTitle = {
      title: info.videoDetails.title,
      url,
    }

    this.titleMap.set(url, resolvedTitle)

    return resolvedTitle
  }

  public async getTitles(urls: readonly string[]): Promise<readonly TitleInfo[]> {
    const allTitles: TitleInfo[] = []

    const titleChunks = chunk(urls, 5)

    for (const titleChunk of titleChunks) {
      const resolvedChunk = await Promise.all(
        titleChunk.map(title => this.getTitle(title)),
      )
      allTitles.push(...resolvedChunk)
    }

    return allTitles
  }

  public async getUrls(title: string): Promise<readonly string[] | undefined> {
    // Is basic url.
    if (/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9-]+$/.test(title)) {
      return [title]
    }

    // Is playlist.
    if (/^https:\/\/www\.youtube\.com\/playlist\?list=[a-zA-Z0-9-]+$/.test(title)) {
      try {
        const playlist = await ytplaylist(title)
        return playlist.items.map(item => item.url)
      } catch (e) {
        console.log(`ytplaylist - error - ${title}`, e)
        return undefined
      }
    }

    const query = await ytsearch(title, { limit: 1 })
    const [firstResult] = query.items

    const url: string | undefined = (firstResult as any)?.url
    return url ? [url] : undefined
  }
}
