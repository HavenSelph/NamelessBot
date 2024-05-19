import {
  Command,
  ExecuteFunction,
  ExtendedInteraction,
} from "../types/command";
import { PermissionResolvable } from "discord.js";

export interface CommandData extends Command {}

export function useSubcommands(
  interaction: ExtendedInteraction,
): [string | null, string] {
  if (!interaction.isChatInputCommand())
    throw new Error("Subcommands are only available with SlashCommands!");
  const group = interaction.options.getSubcommandGroup();
  const command = interaction.options.getSubcommand();
  return [group, command];
}

export function usePermissions(
  interaction: ExtendedInteraction,
  permissions: PermissionResolvable[],
) {
  return (
    interaction.member.guild.ownerId === interaction.user.id ||
    interaction.member.permissions.has(permissions)
  );
}

interface SubCommandHandler {
  //`group/command` or `/command`
  name: string;
  execute: ExecuteFunction;
}

export function newSubcommandHandler(
  handlers: SubCommandHandler[],
): ExecuteFunction {
  const handler_map = new Map<string, ExecuteFunction>();
  for (const handler of handlers) {
    handler_map.set(handler.name, handler.execute);
  }
  return async function Handler(options) {
    let [group, command] = useSubcommands(options.interaction);
    let name = `${group || ""}/${command}`;
    let execute = handler_map.get(name);
    if (!execute) {
      console.error(`No handler defined for ${name}!`);
      return await options.interaction.reply(
        "Internal error, let the developer know.",
      );
    }
    return execute(options);
  };
}
