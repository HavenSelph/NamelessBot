import { CommandData, newSubcommandHandler } from "../structures/Command";
import {
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandUserOption,
} from "discord.js";
import { whitelist } from "../index";
import { WhitelistEntry } from "../whitelist";

function makeEmbed(
  entry: WhitelistEntry,
  title: string = "Whitelist Entry",
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).addFields([
    { name: "User", value: `<@${entry.discord_id}>`, inline: true },
    { name: "Type", value: entry.type, inline: true },
    { name: "\u200b", value: "\u200b" },
    {
      name: "Username",
      value: entry.minecraft_username,
      inline: true,
    },
    {
      name: "UUID",
      value: entry.minecraft_uuid,
      inline: true,
    },
    {
      name: "Date",
      value: new Date(entry.added_on).toDateString(),
      inline: true,
    },
  ]);
  if (entry.minecraft_avatar) embed.setImage(entry.minecraft_avatar);
  return embed;
}

export default {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Handle the server's whitelist.")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Add a user to the whitelist.")
        .addUserOption(
          new SlashCommandUserOption()
            .setName("user")
            .setDescription("Discord user to bind with.")
            .setRequired(true),
        )
        .addStringOption(
          new SlashCommandStringOption()
            .setName("minecraft_username")
            .setDescription("Minecraft account to be whitelisted.")
            .setRequired(true),
        ),
    )
    .addSubcommandGroup(
      new SlashCommandSubcommandGroupBuilder()
        .setName("remove")
        .setDescription(
          "Commands to remove a user or minecraft account from the whitelist.",
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("user")
            .setDescription("Remove all of a Discord user's bound accounts.")
            .addUserOption(
              new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to remove from the whitelist.")
                .setRequired(true),
            ),
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("account")
            .setDescription("Remove all instances of a Minecraft account.")
            .addStringOption(
              new SlashCommandStringOption()
                .setName("minecraft_username")
                .setDescription(
                  "Minecraft account to remove from the whitelist.",
                )
                .setRequired(true),
            ),
        ),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("list")
        .setDescription("List users added to the whitelist."),
    )
    .addSubcommandGroup(
      new SlashCommandSubcommandGroupBuilder()
        .setName("query")
        .setDescription("Query the whitelist by a filter.")
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("user")
            .setDescription("Show a user's bound minecraft accounts.")
            .addUserOption(
              new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to check.")
                .setRequired(true),
            ),
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("account")
            .setDescription("Check if a minecraft account is whitelisted.")
            .addStringOption(
              new SlashCommandStringOption()
                .setName("minecraft_username")
                .setDescription("Minecraft account to check.")
                .setRequired(true),
            ),
        ),
    ),
  execute: newSubcommandHandler([
    {
      name: "/add",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("user", true);
        const username = args.getString("minecraft_username", true);
        const entry = await whitelist
          .add(user.id, username)
          .catch(async (err) => {
            await interaction.editReply(err.message);
          });
        if (!entry) return;
        const embed = makeEmbed(entry, "Success");
        await interaction.editReply({ embeds: [embed] });
      },
    },
    {
      name: "remove/user",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("user", true);
        const result = await whitelist.removeMany({
          discord_id: user.id,
        });
        if (result.acknowledged && result.deletedCount > 0) {
          await interaction.editReply(
            `Deleted all whitelist entries for <@${user.id}>`,
          );
        } else {
          await interaction.editReply(`No whitelist entries for <@${user.id}>`);
        }
      },
    },
    {
      name: "remove/account",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const username = args.getString("minecraft_username", true);
        const result = await whitelist.removeOne({
          minecraft_username: { $regex: username, $options: "i" },
        });
        if (result.acknowledged && result.deletedCount > 0) {
          return interaction.editReply(
            `Removed \`${username}\` from the whitelist.`,
          );
        } else {
          return interaction.editReply(
            `\`${username}\` is not in the whitelist.`,
          );
        }
      },
    },
    {
      name: "/list",
      execute: async ({ interaction }) => {
        await interaction.deferReply({ ephemeral: true });
        const embed = new EmbedBuilder().setTitle("Nameless SMP Whitelist");
        let users = "";
        let accounts = "";
        let times = "";
        const data = await whitelist.queryMany({});
        if (data.length === 0) {
          await interaction.editReply("There are no whitelist entries!");
          return;
        }
        for (const user of data) {
          users += `\n<@${user.discord_id}>`;
          accounts += `\n${user.minecraft_username}`;
          times += `\n${new Date(user.added_on).toLocaleDateString()}`;
        }
        embed.addFields(
          { name: "User", value: users, inline: true },
          { name: "Account", value: accounts, inline: true },
          { name: "Date", value: times, inline: true },
        );
        await interaction.editReply({
          embeds: [embed],
        });
      },
    },
    {
      name: "query/user",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("user", true);
        const entries = await whitelist.queryMany({ discord_id: user.id });
        if (entries.length === 0)
          return interaction.editReply(
            `No whitelist entries for <@${user.id}>`,
          );
        const embed = new EmbedBuilder().setTitle(`Whitelist Entries`);
        let accounts = "";
        let times = "";
        for (const user of entries) {
          accounts += `\n${user.minecraft_username}`;
          times += `\n${new Date(user.added_on).toLocaleDateString()}`;
        }
        embed.addFields(
          { name: "User", value: `<@${user.id}>` },
          { name: "Account", value: accounts, inline: true },
          { name: "Date", value: times, inline: true },
        );
        await interaction.editReply({
          embeds: [embed],
        });
      },
    },
    {
      name: "query/account",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const username = args.getString("minecraft_username", true);
        const entry = await whitelist.queryOne({
          minecraft_username: { $regex: username, $options: "i" },
        });
        if (!entry) {
          await interaction.editReply(`\`${username}\` is not whitelisted.`);
          return;
        }
        const embed = makeEmbed(entry);
        await interaction.editReply({ embeds: [embed] });
      },
    },
  ]),
} satisfies CommandData;
