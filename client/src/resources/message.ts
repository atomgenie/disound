import { Message } from "discord.js"
import { MessageDependencies } from "./dependencies"

export class MessageResource {
  private commandMatch: RegExp

  constructor(private dependencies: MessageDependencies) {
    if (dependencies.isDev) {
      this.commandMatch = /^!!!(.*)$/
    } else {
      this.commandMatch = /^!!(.*)$/
    }
  }

  async handleMessage(message: Message) {
    const results = this.commandMatch.exec(message.content)

    if (!results) {
      return
    }

    const payload = results[1]

    console.info("New comment", payload, {
      guild: message.guild?.id,
      user: message.author.id,
    })

    const play = /^play (.+)$/.exec(payload)

    if (play) {
      await this.dependencies.player.play(message, play[1])
      return
    }

    if (payload === "skip") {
      await this.dependencies.player.skip(message)
      return
    }

    if (payload === "queue") {
      await this.dependencies.player.queue(message)
      return
    }

    if (payload === "stop") {
      await this.dependencies.player.stop(message)
      return
    }

    if (payload === "pause") {
      await this.dependencies.player.pause(message)
      return
    }

    if (payload === "resume") {
      await this.dependencies.player.resume(message)
    }

    const loop = /^loop (.+)$/.exec(payload)

    if (loop) {
      await this.dependencies.player.loop(loop[1], message)
    }
  }
}
