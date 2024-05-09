import { CommandData } from "../structures/Command";
import {
  AttachmentBuilder,
  SlashCommandBuilder,
  SlashCommandNumberOption,
  SlashCommandStringOption,
} from "discord.js";
import { generate_map } from "../map/map";

export default {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription("Generate a Minecraft map like png.")
    .addStringOption(
      new SlashCommandStringOption()
        .setName("world")
        .setDescription("The dimension to use when generating the map.")
        .setChoices(
          { name: "overworld", value: "world" },
          { name: "nether", value: "world_nether" },
          { name: "end", value: "world_the_end" },
        )
        .setRequired(true),
    )
    .addNumberOption(
      new SlashCommandNumberOption()
        .setName("x")
        .setDescription("X coordinate")
        .setRequired(true),
    )
    .addNumberOption(
      new SlashCommandNumberOption()
        .setName("z")
        .setDescription("Z coordinate")
        .setRequired(true),
    )
    .addNumberOption(
      new SlashCommandNumberOption()
        .setName("radius")
        .setDescription("Number of tiles surrounding the coordinates.")
        .setMinValue(0)
        .setMaxValue(1),
    ),
  execute: async ({ interaction, args }) => {
    await interaction.deferReply();
    await interaction.editReply(
      "Generating image, this could take a couple seconds.",
    );
    const world = args.getString("world", true);
    const radius = args.getNumber("radius") || 0;
    const x = args.getNumber("x", true);
    const z = args.getNumber("z", true);
    const image = await generate_map(world, radius, x, z);
    await interaction.editReply("Preparing to upload image...");
    const attachment = new AttachmentBuilder(image, {
      name: "generated.png",
    });
    await interaction.editReply({
      content: "",
      files: [attachment],
    });
  },
} satisfies CommandData;
