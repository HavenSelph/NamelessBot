import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "../types/command";
import { Event } from "../structures/Event";
import { client } from "../index";

export default new Event("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command)
    return interaction.followUp(`Unknown command '${interaction.commandName}'`);
  console.info(
    `Running [${interaction.commandName}] for @${interaction.user.displayName} (${interaction.user.id})`,
  );
  await command.execute({
    client,
    interaction: interaction as ExtendedInteraction,
    args: interaction.options as CommandInteractionOptionResolver,
  });
});
