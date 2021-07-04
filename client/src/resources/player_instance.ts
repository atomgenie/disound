import { Message, MessageEmbed, VoiceChannel, VoiceConnection } from "discord.js"
import { PlayerInstanceDependencies } from "./dependencies"
import ytdl from "ytdl-core"
import { Subject, Subscription } from "rxjs"
import { filter } from "rxjs/operators"

enum PlayerEvents {
  SKIP,
  STOP,
  PAUSE,
  RESUME,
}

enum LoopStatus {
  NONE = "NONE",
  MUSIC = "MUSIC",
  QUEUE = "QUEUE",
}

export class PlayerInstanceResource {
  private playing = false
  private nowPlaying: string = ""
  private queue: string[] = []
  private channel: VoiceChannel | undefined
  private events = new Subject<PlayerEvents>()
  private loopStatus: LoopStatus = LoopStatus.NONE
  private isStop = false

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
      const onEnd = (subscription: Subscription) => {
        subscription.unsubscribe()
        setImmediate(res)
      }

      const soundStream = ytdl(title, { filter: "audioonly" })

      const channelStream = connection.play(soundStream)

      channelStream.on("error", rej)
      channelStream.on("end", res)
      channelStream.on("finish", res)

      const rxSubscription = this.events.subscribe(data => {
        switch (data) {
          case PlayerEvents.SKIP:
          case PlayerEvents.STOP:
            soundStream.destroy()
            channelStream.destroy()
            onEnd(rxSubscription)
            break

          case PlayerEvents.PAUSE:
            channelStream.pause()
            break

          case PlayerEvents.RESUME:
            channelStream.resume()
            break
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

      do {
        try {
          await this.playMusic(connection, nowPlaying)
        } catch (e) {
          console.error("Can't play music", nowPlaying, e)
          message.channel.send(
            `I can't play ${(await this.dependencies.title.getTitle(nowPlaying)).title}`,
          )
        }
      } while (this.loopStatus === LoopStatus.MUSIC && !this.isStop)

      if (this.loopStatus === LoopStatus.QUEUE) {
        this.queue.push(nowPlaying)
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

    messageEmbed.addField("Loop", `\`${this.loopStatus.toLowerCase()}\``)

    await message.channel.send(messageEmbed)
  }

  public async stop() {
    this.queue = []
    this.isStop = true
    this.events.next(PlayerEvents.STOP)
  }

  public async pause() {
    this.events.next(PlayerEvents.PAUSE)
  }

  public async resume() {
    this.events.next(PlayerEvents.RESUME)
  }

  public async loop(loopStatus: string, message: Message) {
    switch (loopStatus) {
      case "music":
        this.loopStatus = LoopStatus.MUSIC
        break
      case "queue":
        this.loopStatus = LoopStatus.QUEUE
        break
      case "stop":
        this.loopStatus = LoopStatus.NONE
        break
      default:
        message.reply(
          `'loop ${loopStatus}' is not a valid command. Availables: [music, queue, stop].`,
        )
        return
    }

    await message.react("👍")
  }
}
