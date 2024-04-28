import { Snowflake } from "discord.js";
import * as fs from "node:fs";

interface WhitelistEntry {
  added_on: number;
  discord_id: string;
  minecraft_username: string;
  minecraft_uuid: string;
}

export class Whitelist {
  data: WhitelistEntry[];
  path: string;
  changed: boolean;
  constructor(path: string) {
    this.path = path;
    this.changed = true;
    this.data = [];
    const timeout = async () => {
      await this.sync();
      setTimeout(timeout, 1000 * 10);
    };
    timeout().catch();
  }
  get accounts() {
    let accounts: string[] = [];
    for (const entry of this.data) {
      if (entry.minecraft_username in accounts) continue;
      accounts.push(entry.minecraft_username);
    }
    return accounts;
  }
  async get_uuid(minecraft_username: string) {
    const resp = await fetch(
      `https://playerdb.co/api/player/minecraft/${minecraft_username}`,
    ).then((res) => res.json());
    if (!resp.success) return null;
    return resp.data.player.id;
  }
  async add(discord_id: Snowflake, minecraft_username: string) {
    const uuid = await this.get_uuid(minecraft_username);
    if (!uuid)
      throw new Error(
        `No minecraft account exists with username ${minecraft_username}!`,
      );
    if (this.accounts.includes(minecraft_username))
      throw new Error(
        `The minecraft account \`${minecraft_username}\` already exists in the whitelist!`,
      );
    console.log(`Adding ${minecraft_username} (${uuid}) to the whitelist!`);
    this.changed = true;
    const entry = {
      added_on: Date.now(),
      discord_id: discord_id,
      minecraft_username: minecraft_username.toString(),
      minecraft_uuid: uuid,
    };
    this.data.push(entry);
    return entry;
  }
  async remove(filter: (entry: WhitelistEntry) => boolean) {
    let removed: WhitelistEntry[] = [];
    this.data = this.data.filter((entry) => {
      if (!filter(entry)) return true;
      this.changed = true;
      removed.push(entry);
    });
    return removed;
  }
  async filter(filter: (entry: WhitelistEntry) => boolean) {
    return this.data.filter(filter);
  }
  async sync() {
    if (!this.changed) return;
    const data = this.data.map((entry) => {
      return { uuid: entry.minecraft_uuid, name: entry.minecraft_username };
    });
    fs.writeFile(this.path, JSON.stringify(data, null, 2), (err) => {
      if (err) return console.error(err);
      this.changed = false;
      console.log("Synced whitelist to drive!");
    });
  }
}
