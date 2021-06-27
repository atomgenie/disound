import {
  Message,
  MessageEmbed,
  StreamDispatcher,
  VoiceChannel,
  VoiceConnection,
} from "discord.js"
import { PlayerInstanceDependencies } from "./dependencies"
import ytdl from "ytdl-core"
import { Subject } from "rxjs"
import { filter } from "rxjs/operators"

enum PlayerEvents {
  SKIP,
  STOP,
}

export class PlayerInstanceResource {
  private playing = false
  private nowPlaying: string = ""
  private queue: string[] = []
  private channel: VoiceChannel | undefined
  private events = new Subject<PlayerEvents>()

  constructor(
    private dependencies: PlayerInstanceDependencies,
    private onStop: () => void,
  ) {}

  private async cleanup() {
    this.playing = false
    await this.channel?.leave()
    this.onStop()
  }

  private async playMusic(connection: VoiceConnection, title: string) {
    this.nowPlaying = title
    return new Promise<void>((res, rej) => {
      const soundStream = ytdl(title, { filter: "audioonly" })

      const channelStream = connection.play(soundStream)

      channelStream.on("error", rej)
      channelStream.on("end", res)
      channelStream.on("finish", res)
      this.events.subscribe(data => {
        switch (data) {
          case PlayerEvents.SKIP:
          case PlayerEvents.STOP:
            soundStream.destroy()
            channelStream.destroy()
            setImmediate(res)
        }
      })
    })
  }

  public async play(message: Message, title: string) {
    const url = await this.dependencies.title.getUrls(title)

    if (!url) {
      return
    }

    this.queue.push(...url)

    if (this.playing) {
      await message.react("👍")
      return
    }

    this.playing = true
    const channel = message.member?.voice.channel

    if (!channel) {
      return
    }

    this.channel = channel

    let connection

    try {
      connection = await channel.join()
    } catch {
      message.reply("I can't join the channel!")
      await this.cleanup()
      return
    }

    await message.react("👍")

    while (this.queue.length) {
      const [nowPlaying, ...titles] = this.queue
      this.queue = titles

      try {
        await this.playMusic(connection, nowPlaying)
      } catch (e) {
        console.error("Can't play music", nowPlaying, e)
        message.channel.send(
          `I can't play ${(await this.dependencies.title.getTitle(nowPlaying)).title}`,
        )
      }
    }

    await this.cleanup()
  }

  public async skip() {
    if (!this.playing) {
      return
    }

    this.events.next(PlayerEvents.SKIP)
  }

  public async getQueue(message: Message) {
    const { channel } = message

    if (!this.playing) {
      channel.send("Not music is being played.")
      return
    }

    const messageEmbed = new MessageEmbed()
    const firstQueues = this.queue.slice(0, 5)
    const resolvedTitles = await this.dependencies.title.getTitles(firstQueues)
    console.log("Title", resolvedTitles)

    const nowPlayingTitle = await this.dependencies.title.getTitle(this.nowPlaying)

    messageEmbed.addField(
      "Now playing",
      `- [${nowPlayingTitle.title}](${nowPlayingTitle.url})`,
    )

    if (this.queue.length) {
      messageEmbed.addField(
        "Queue",
        resolvedTitles.map(title => `- [${title.title}](${title.url})`).join("\n"),
      )
    }

    await message.channel.send(messageEmbed)
  }

  public async stop() {
    this.queue = []
    this.events.next(PlayerEvents.STOP)
  }
}
