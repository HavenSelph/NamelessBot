import { CommandData } from "../../structures/Command";
import { SlashCommandBuilder } from "discord.js";

export default {
  enabled: false,
  data: new SlashCommandBuilder()
    .setName("whoami")
    .setDescription("Replies with the user who invoked it."),
  execute: async ({ interaction }) => {
    await interaction.reply(`<@${interaction.user.id}>`);
  },
} satisfies CommandData;
