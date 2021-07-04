import { Message } from "discord.js"
import { PlayerDependencies } from "./dependencies"
import { PlayerInstanceResource } from "./player_instance"
import { TitleYoutubeResource } from "./title_youtube"

export class PlayerResource {
  private playersMap = new Map<string, PlayerInstanceResource>()

  constructor(private dependencies: PlayerDependencies) {}

  private getPlayer(message: Message): PlayerInstanceResource | undefined {
    const { guild } = message

    if (!guild) {
      return undefined
    }

    let player = this.playersMap.get(guild.id)

    if (!player) {
      player = new PlayerInstanceResource(
        { ...this.dependencies, guild, title: new TitleYoutubeResource() },
        () => {
          this.playersMap.delete(guild.id)
        },
      )
      this.playersMap.set(guild.id, player)
    }

    return player
  }

  public async play(message: Message, title: string) {
    const player = this.getPlayer(message)
    await player?.play(message, title)
  }

  public async skip(message: Message) {
    const player = this.getPlayer(message)
    await player?.skip()
  }

  public async queue(message: Message) {
    const player = this.getPlayer(message)
    await player?.getQueue(message)
  }

  public async stop(message: Message) {
    const player = this.getPlayer(message)
    await player?.stop()
  }

  public async resume(message: Message) {
    const player = this.getPlayer(message)
    await player?.resume()
  }

  public async pause(message: Message) {
    const player = this.getPlayer(message)
    await player?.pause()
  }

  public async loop(payload: string, message: Message) {
    const player = this.getPlayer(message)
    await player?.loop(payload, message)
  }
}
