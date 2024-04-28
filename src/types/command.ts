import { ExtendedClient } from "../structures/Client";
import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
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

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: ExecuteFunction;
}
