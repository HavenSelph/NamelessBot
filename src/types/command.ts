import { ExtendedClient } from "../structures/Client";
import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export interface ExecuteOptions {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
}

export type ExecuteFunction = (options: ExecuteOptions) => Promise<any>;

export interface CommandData {
  data: SlashCommandBuilder;
  execute: ExecuteFunction;
}
