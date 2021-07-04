import { Guild } from "discord.js"
import type { DiscordResource } from "./discord"
import { PlayerResource } from "./player"
import { TitleYoutubeResource } from "./title_youtube"

export interface BaseDependencies {
  discord: DiscordResource
}

export interface MessageDependencies extends BaseDependencies {
  player: PlayerResource
  isDev: boolean
}

export interface PlayerDependencies extends BaseDependencies {}

export interface PlayerInstanceDependencies extends BaseDependencies {
  guild: Guild
  title: TitleYoutubeResource
}
