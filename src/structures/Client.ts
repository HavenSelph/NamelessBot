import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  ClientOptions,
  Collection,
  Events,
} from "discord.js";
import { RegisterCommandsOptions } from "../types/client";
import { Event } from "./Event";
import * as fg from "fast-glob";
import { CommandData } from "../types/command";

interface ExtendedClientOptions extends ClientOptions {
  guildId?: string;
}

export class ExtendedClient extends Client {
  guildId?: string;
  commands: Collection<string, CommandData>;

  constructor({ guildId, ...options }: ExtendedClientOptions) {
    super(options);
    this.guildId = guildId;
    this.commands = new Collection();
  }

  start(token: string) {
    this.getEvents().catch(console.error);
    this.getCommands().catch(console.error);
    this.login(token).catch(console.error);
  }

  async importFile(filepath: string) {
    return (await import(filepath))?.default;
  }

  async registerCommands({ commands, guildId }: RegisterCommandsOptions) {
    if (guildId) {
      console.log(`Guild ID (${guildId}) specified, doing quick register.`);
      this.guilds.cache.get(guildId)?.commands.set(commands);
      console.log(commands);
    } else {
      console.log("No guild ID specified, registering commands globally.");
      this.application?.commands.set(commands);
    }
  }

  async getCommands() {
    const commands: ApplicationCommandDataResolvable[] = [];
    const commandPaths = await fg.async(`../commands/**/*{.ts,.js}`, {
      cwd: __dirname,
    });

    for (const commandPath of commandPaths) {
      const command: CommandData = await this.importFile(commandPath);
      if (!command) {
        console.error(`Ignoring command (invalid config): ${commandPath}`);
        continue;
      }
      this.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    }

    this.on(Events.ClientReady, () =>
      this.registerCommands({
        commands,
        guildId: this.guildId,
      }),
    );
    console.log(`Found and registered [${commands.length}] command(s).`);
  }

  async getEvents() {
    const eventPaths = await fg.async(`../events/*{.ts,.js}`, {
      cwd: __dirname,
    });
    for (const eventPath of eventPaths) {
      const event: Event<keyof ClientEvents> = await this.importFile(eventPath);
      this.on(event.event, event.execute);
    }
  }
}
