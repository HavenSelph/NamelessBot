import { CommandData } from "../../structures/Command";
import {
  AttachmentBuilder,
  MessagePayload,
  SlashCommandBuilder,
  SlashCommandNumberOption,
} from "discord.js";
import { generate_map } from "../../map";

const x_option = new SlashCommandNumberOption()
  .setName("x")
  .setDescription("X coordinate")
  .setRequired(true);
const z_option = new SlashCommandNumberOption()
  .setName("z")
  .setDescription("Z coordinate")
  .setRequired(true);
const radius_option = new SlashCommandNumberOption()
  .setName("radius")
  .setDescription("Number of tiles surrounding the coordinates.")
  .setRequired(true);

export default {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Command for testing in development features.")
    .addNumberOption(x_option)
    .addNumberOption(z_option)
    .addNumberOption(radius_option),
  execute: async ({ interaction, args }) => {
    await interaction.deferReply();
    await interaction.editReply("Loading image...");
    const x = args.getNumber("x", true);
    const z = args.getNumber("z", true);
    const radius = args.getNumber("radius", true);
    const world = "world";
    const image = await generate_map(world, radius, x, z);
    await interaction.editReply("Preparing upload...");
    const attachment = new AttachmentBuilder(image, {
      name: "generated.png",
    });
    await interaction.editReply({
      content: "",
      files: [attachment],
    });
  },
} satisfies CommandData;
