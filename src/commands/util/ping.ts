import { CommandData } from "../../structures/Command";
import { SlashCommandBuilder } from "discord.js";

export default {
  enabled: false,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sends the response time for this command."),
  execute: async ({ interaction }) => {
    await interaction.reply(`Pong!`);
  },
} satisfies CommandData;
