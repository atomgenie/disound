import { Client } from "discord.js"
import { MessageResource } from "./message"
import { PlayerResource } from "./player"

export class DiscordResource {
  private client: Client
  private messageResource: MessageResource

  constructor(token: string) {
    this.client = new Client()
    this.client.login(token)

    const player = new PlayerResource({ discord: this })

    this.messageResource = new MessageResource({ discord: this, player })
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
