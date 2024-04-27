import { ExtendedClient } from "./structures/Client";
import config from "../config.json";
import { GatewayIntentBits } from "discord.js";

export const client = new ExtendedClient({
  guildId: config.GUILD_ID,
  intents: [GatewayIntentBits.Guilds],
});

client.start(config.BOT_TOKEN);
