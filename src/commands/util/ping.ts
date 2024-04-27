import { CommandData } from "../../types/command";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sends the response time for this command."),
  execute: async ({ interaction }) => {
    await interaction.reply(`Pong!`);
  },
} satisfies CommandData;
