import { Client } from "discord.js"
import { MessageResource } from "./message"
import { PlayerResource } from "./player"

interface Options {
  isDev: boolean
}

export class DiscordResource {
  private client: Client
  private messageResource: MessageResource

  constructor(token: string, options: Options) {
    this.client = new Client()
    this.client.login(token)

    const player = new PlayerResource({ discord: this })

    this.messageResource = new MessageResource({
      discord: this,
      player,
      isDev: options.isDev,
    })
  }

  private onStart() {
    console.log("Server started")
  }

  public async start() {
    this.client.on("ready", () => this.onStart())
    this.client.on("message", async message =>
      this.messageResource.handleMessage(message),
    )

    return new Promise(() => {})
  }
}
