import { DiscordResource } from "resources/discord"
import { DisoundError } from "resources/error"

const start = async () => {
  let token
  let isDev = false

  if (process.env.NODE_ENV === "dev") {
    token = process.env.DEV_TOKEN
    isDev = true
  } else {
    token = process.env.TOKEN
  }

  if (!token) {
    throw new DisoundError({
      message: "Bad token",
      type: "CONFIG",
    })
  }

  const client = new DiscordResource(token, { isDev })
  await client.start()
}

start()
