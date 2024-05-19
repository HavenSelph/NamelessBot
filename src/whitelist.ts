import { db, bot_client } from "./index";
import { Collection, Filter } from "mongodb";
import * as fs from "node:fs";
import { toUUID } from "./uuid";

export interface WhitelistEntry {
  added_on: number;
  discord_id: string;
  type: "Bedrock" | "Java";
  minecraft_username: string;
  minecraft_uuid: string;
  minecraft_avatar?: string;
}

export class Whitelist {
  path: string;
  changed: boolean;
  guildId: string;
  collection: Collection<WhitelistEntry>;
  constructor(path: string, guildId: string) {
    this.path = path;
    this.guildId = guildId;
    this.changed = true;
    this.collection = db.collection<WhitelistEntry>(`whitelist-entries`);
  }
  start_sync(sync_timeout: number) {
    const timeout = async () => {
      await this.sync();
      setTimeout(timeout, sync_timeout);
    };
    timeout().catch(console.error);
  }
  start_audit(audit_timeout: number) {
    const timeout = async () => {
      await this.audit();
      setTimeout(timeout, audit_timeout);
    };
    timeout().catch(console.error);
  }
  async audit() {
    console.log("Beginning member audit.");
    const guild = bot_client.guilds.resolve(this.guildId);
    if (!guild) return console.error("Could not access guild!");
    const member_ids = (await guild.members.fetch()).map((member) => member.id);
    const data = this.collection.find();
    let count = 0;
    for await (const entry of data) {
      if (member_ids.includes(entry.discord_id)) continue;
      await this.removeOne({ _id: entry._id });
      count++;
    }
    if (count > 0) {
      this.changed = true;
    }
    console.log(`Removed ${count} entries from whitelist during audit.`);
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
  async get_account(minecraft_username: string, type: string) {
    const is_bedrock = type === "bedrock";
    const resp = await fetch(
      `https://playerdb.co/api/player/${is_bedrock ? "xbox" : "minecraft"}/${minecraft_username}`,
    ).then((res) => res.json());
    if (!resp.success) return;
    let uuid: string = resp.data.player.id;
    if (is_bedrock) uuid = toUUID(Number(uuid).toString(16).padStart(32, "0"));
    return {
      username: `${is_bedrock ? "." : ""}${resp.data.player.username}`,
      avatar: is_bedrock ? undefined : resp.data.player.avatar,
      uuid,
    };
  }
  async add(discord_id: string, minecraft_username: string, type: string) {
    const is_bedrock = type === "bedrock";
    const account = await this.get_account(minecraft_username, type);
    if (!account && is_bedrock) {
      // Bedrock account
      throw new Error(`${minecraft_username} is not a Bedrock account!`);
    } else if (!account) {
      // Java account
      throw new Error(`${minecraft_username} is not a Minecraft account!`);
    }
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
      type: is_bedrock ? "Bedrock" : "Java",
      minecraft_username: account.username,
      minecraft_uuid: account.uuid,
      minecraft_avatar: account.avatar,
    };
    await this.collection.insertOne(entry);
    this.changed = true;
    return entry;
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
    return this.collection.find(query).toArray();
  }

  async queryManyPaginated(
    query: Filter<WhitelistEntry>,
    skip: number = 0,
    limit: number = 15,
  ) {
    return this.collection.find(query).skip(skip).limit(limit).toArray();
  }

  async count(query: Filter<WhitelistEntry>) {
    if (Object.keys(query).length === 0)
      // Fast count ?cached? documents
      return await this.collection.estimatedDocumentCount();
    else return await this.collection.countDocuments(query);
  }
}
