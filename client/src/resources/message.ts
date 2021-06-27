import { Message } from "discord.js"
import { MessageDependencies } from "./dependencies"

const commandMatch = /^!!(.*)$/

export class MessageResource {
  constructor(private dependencies: MessageDependencies) {}

  async handleMessage(message: Message) {
    const results = commandMatch.exec(message.content)

    if (!results) {
      return
    }

    const payload = results[1]

    console.info("New comment", payload, {
      guild: message.guild?.id,
      user: message.author.id,
    })

    const play = /^play (.*)$/.exec(payload)

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
  }
}
