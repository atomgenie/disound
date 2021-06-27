import { DiscordResource } from "resources/discord"
import { DisoundError } from "resources/error"

const start = async () => {
  const token = process.env.TOKEN

  if (!token) {
    throw new DisoundError({
      message: "Bad token",
      type: "CONFIG",
    })
  }

  const client = new DiscordResource(token)
  await client.start()
}

start()
