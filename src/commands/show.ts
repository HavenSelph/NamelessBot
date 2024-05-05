import { CommandData, useSubcommands } from "../structures/Command";
import {
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandNumberOption,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { chromium } from "playwright";

const x_option = new SlashCommandNumberOption()
  .setName("x")
  .setDescription("X coordinate")
  .setRequired(true);
const z_option = new SlashCommandNumberOption()
  .setName("z")
  .setDescription("Z coordinate")
  .setRequired(true);

export default {
  data: new SlashCommandBuilder()
    .setName("show")
    .setDescription("Show an image of a position in minecraft")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("overworld")
        .setDescription(
          "Show a position in the overworld using the online map.",
        )
        .addNumberOption(x_option)
        .addNumberOption(z_option),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("nether")
        .setDescription("Show a position in the nether using the online map.")
        .addNumberOption(x_option)
        .addNumberOption(z_option),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("end")
        .setDescription("Show a position in the end using the online map.")
        .addNumberOption(x_option)
        .addNumberOption(z_option),
    ),
  execute: async ({ interaction, args }) => {
    await interaction.deferReply();
    await interaction.followUp(
      "Loading image, this could take a couple seconds.",
    );
    const [_group, command] = useSubcommands(interaction);
    const position_x = args.getNumber("x", true);
    const position_z = args.getNumber("z", true);
    let world = "world";
    if (command === "nether") world = "world_nether";
    if (command === "end") world = "world_the_end";
    let pretty_world = "Overworld";
    if (command === "nether") pretty_world = "The Nether";
    if (command === "end") pretty_world = "The End";

    const url = `https://mc.playnameless.net/?world=world&x=${position_x}&z=${position_z}`;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 920, height: 920 });
    await page.goto(url, { waitUntil: "networkidle" });
    const img = await page.screenshot({
      type: "png",
      clip: { width: 800, height: 800, x: 60, y: 60 },
    });
    await browser.close();
    await interaction.editReply({
      content: `**${pretty_world}**: *${position_x}, ${position_z}*`,
      files: [img],
    });
  },
} satisfies CommandData;
