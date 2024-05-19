import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "../types/command";
import { Event } from "../structures/Event";
import { bot_client as client } from "../index";

export default new Event("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command)
    return interaction.followUp(`Unknown command '${interaction.commandName}'`);
  console.info(
    `Running [${interaction.commandName}] for @${interaction.user.displayName} (${interaction.user.id})`,
  );
  await command
    .execute({
      client,
      interaction: interaction as ExtendedInteraction,
      args: interaction.options as CommandInteractionOptionResolver,
    })
    .catch((err) => {
      console.log(err);
      const error_message = `An error occurred, please let Haven know, and include this message:
\`\`\`Command: ${interaction.commandName}\n\n${err}\n\n${interaction.toString()}\`\`\``;
      if (!interaction.replied) interaction.editReply(error_message);
      else interaction.reply(error_message);
    });
});
