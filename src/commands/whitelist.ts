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
        await interaction.editReply(
          `Bound minecraft account \`${entry.minecraft_username} (${entry.minecraft_uuid})\` to <@${user.id}>.`,
        );
      },
    },
    {
      name: "remove/user",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("user", true);
        const result = await whitelist.remove(
          (entry) => entry.discord_id === user.id,
        );
        if (result.length > 0) {
          await interaction.editReply(
            `Removed <@${user.id}> from the whitelist.`,
          );
        } else {
          await interaction.editReply(
            `No whitelist entries with <@${user.id}>.`,
          );
        }
      },
    },
    {
      name: "remove/account",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const username = args.getString("minecraft_username", true);
        const result = await whitelist.remove(
          (entry) => entry.minecraft_username === username,
        );
        if (result.length > 0) {
          return interaction.editReply(
            `Removed \`${username}\` from the whitelist.`,
          );
        } else {
          return interaction.editReply(
            "No whitelist entries with that minecraft account.",
          );
        }
      },
    },
    {
      name: "/list",
      execute: async ({ client, interaction }) => {
        await interaction.deferReply({ ephemeral: true });
        const embed = new EmbedBuilder().setTitle("Nameless SMP Whitelist");
        let users = "";
        let accounts = "";
        let times = "";
        if (whitelist.data.length === 0)
          return interaction.editReply("There are no whitelist entries.");
        for (const user of whitelist.data) {
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
        const entries = await whitelist.filter(
          (entry) => entry.discord_id === user.id,
        );
        if (entries.length === 0)
          return interaction.editReply(
            `<@${user.id}> has no whitelist entries.`,
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
        const entry = await whitelist.filter(
          (entry) => entry.minecraft_username === username,
        );
        if (entry.length > 0) {
          await interaction.editReply(
            `<@${entry[0].discord_id}> - \`${entry[0].minecraft_username} (${entry[0].minecraft_uuid})\` *${new Date(entry[0].added_on).toDateString()}*`,
          );
        } else {
          await interaction.editReply(`\`${username}\` is not whitelisted.`);
        }
      },
    },
  ]),
} satisfies CommandData;
