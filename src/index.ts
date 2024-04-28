import { ExtendedClient } from "./structures/Client";
import config from "../config.json";
import { GatewayIntentBits } from "discord.js";
import { Whitelist } from "./whitelist";

export const client = new ExtendedClient({
  guildId: config.GUILD_ID,
  intents: [GatewayIntentBits.Guilds],
});
export const whitelist = new Whitelist(config.WHITELIST_PATH);

client.start(config.BOT_TOKEN);
