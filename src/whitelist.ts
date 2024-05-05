import { db } from "./index";
import { Collection, Filter } from "mongodb";
import * as fs from "node:fs";

interface WhitelistEntry {
  added_on: number;
  discord_id: string;
  minecraft_username: string;
  minecraft_uuid: string;
  minecraft_avatar: string;
}

export class Whitelist {
  path: string;
  changed: boolean;
  collection: Collection<WhitelistEntry>;
  constructor(path: string) {
    this.path = path;
    this.changed = true;
    this.collection = db.collection<WhitelistEntry>("whitelist-entries");
  }
  start_sync(sync_timeout: number) {
    const timeout = async () => {
      await this.sync();
      setTimeout(timeout, 1000 * sync_timeout);
    };
    timeout().catch(console.error);
  }
  async sync() {
    if (!this.changed) return;
    const data = await this.collection.find().toArray();
    const data_mapped: { name: string; uuid: string }[] = data.map((entry) => {
      return { name: entry.minecraft_username, uuid: entry.minecraft_uuid };
    });
    fs.writeFile(this.path, JSON.stringify(data_mapped, null, 2), (err) => {
      if (err) return console.error(err);
      this.changed = false;
      console.log(`Successfully synced ${data.length} entries to disk.`);
    });
  }
  async get_account(minecraft_username: string) {
    const resp = await fetch(
      `https://playerdb.co/api/player/minecraft/${minecraft_username}`,
    ).then((res) => res.json());
    if (!resp.success) return;
    return {
      username: resp.data.player.username,
      avatar: resp.data.player.avatar,
      uuid: resp.data.player.id,
    };
  }

  async add(discord_id: string, minecraft_username: string) {
    if (minecraft_username.startsWith(".")) {
      // Microsoft account
      throw new Error("Microsoft accounts are not yet implemented.");
    } else {
      // Java account
      const account = await this.get_account(minecraft_username);
      if (!account)
        throw new Error(`${minecraft_username} is not a Minecraft account!`);
      const checkIfExists = await this.collection.findOne({
        minecraft_username: account.username,
      });
      if (checkIfExists)
        throw new Error(
          `${checkIfExists.minecraft_username} is already in the whitelist!`,
        );
      const entry: WhitelistEntry = {
        added_on: Date.now(),
        discord_id: discord_id,
        minecraft_username: account.username,
        minecraft_uuid: account.uuid,
        minecraft_avatar: account.avatar,
      };
      await this.collection.insertOne(entry);
      this.changed = true;
      return entry;
    }
  }
  async removeOne(query: Filter<WhitelistEntry>) {
    const deleteResult = await this.collection.deleteOne(query);
    if (deleteResult.acknowledged) this.changed = true;
    return deleteResult;
  }

  async removeMany(query: Filter<WhitelistEntry>) {
    const deleteResult = await this.collection.deleteMany(query);
    if (deleteResult.acknowledged) this.changed = true;
    return deleteResult;
  }

  async queryOne(query: Filter<WhitelistEntry>) {
    return await this.collection.findOne(query);
  }
  async queryMany(query: Filter<WhitelistEntry>) {
    return await this.collection.find(query).toArray();
  }
}
