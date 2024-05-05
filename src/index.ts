import { ExtendedClient } from "./structures/Client";
import config from "../config.json";
import { GatewayIntentBits } from "discord.js";
import { Whitelist } from "./whitelist";
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = `mongodb+srv://${config.db.username}:${config.db.password}@${config.db.url}/?retryWrites=true&w=majority&appName=${config.db.app_name}`;
export const db_client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
export const db = db_client.db(config.db.name);

export const bot_client = new ExtendedClient({
  guildId: config.guild_id,
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

export const whitelist = new Whitelist(config.whitelist_path, config.guild_id);

async function run() {
  await db_client.connect();
  await db_client.db("admin").command({ ping: 1 });
  console.log(
    `Connected to MongoDB as ${config.db.username} @ ${config.db.url}`,
  );
  bot_client.on("ready", () => {
    whitelist.start_sync(config.whitelist_sync_seconds * 1000);
    whitelist.start_audit(config.whitelist_audit_minutes * 1000 * 60);
  });
  bot_client.start(config.bot_token);
}

//Cleanups
//catching signals and doing cleanup
[
  "SIGHUP",
  "SIGINT",
  "SIGQUIT",
  "SIGILL",
  "SIGTRAP",
  "SIGABRT",
  "SIGBUS",
  "SIGFPE",
  "SIGUSR1",
  "SIGSEGV",
  "SIGUSR2",
  "SIGTERM",
].forEach(function (signal) {
  process.on(signal, async () => {
    await db_client.close(true);
    console.log("Gracefully disconnected MongoDB");
    process.exit(1);
  });
});

process.on("exit", async (code) => {
  await db_client.close(true);
  console.log("Gracefully disconnected MongoDB");
  process.exit(code);
});

run().catch(console.error);
