import { CommandData, newSubcommandHandler } from "../structures/Command";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBooleanOption,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandUserOption,
} from "discord.js";
import { whitelist } from "../index";
import { WhitelistEntry } from "../whitelist";

function escapeMarkdown(text: string): string {
  return text.replace("_", "\\_");
}

function makeEntryListEmbed(
  data: WhitelistEntry[],
  title: string = "Whitelist Entries",
) {
  const embed = new EmbedBuilder().setTitle(title);
  let users = "";
  let accounts = "";
  let times = "";
  for (const user of data) {
    users += `<@${user.discord_id}>\n`;
    accounts += `${user.minecraft_username}\n`;
    times += `${new Date(user.added_on).toLocaleDateString()}\n`;
  }
  embed.addFields(
    { name: "User", value: users, inline: true },
    { name: "Account", value: escapeMarkdown(accounts), inline: true },
    { name: "Date", value: times, inline: true },
  );
  return embed;
}

function makeEntryEmbed(
  entry: WhitelistEntry,
  title: string = "Whitelist Entry",
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).addFields([
    { name: "User", value: `<@${entry.discord_id}>`, inline: true },
    { name: "Type", value: entry.type, inline: true },
    { name: "\u200b", value: "\u200b" },
    {
      name: "Username",
      value: escapeMarkdown(entry.minecraft_username),
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

const AccountType = (required: boolean = false) =>
  new SlashCommandStringOption()
    .setName("account_type")
    .setDescription("Java Edition or Bedrock Edition.")
    .setChoices(
      { name: "Java Edition", value: "java" },
      { name: "Bedrock Edition", value: "bedrock" },
    )
    .setRequired(required);

const DiscordUser = (
  name: string,
  description: string,
  required: boolean = false,
) =>
  new SlashCommandUserOption()
    .setName(name)
    .setDescription(description)
    .setRequired(required);

const MinecraftAccount = (
  name: string,
  description: string,
  required: boolean = false,
) =>
  new SlashCommandStringOption()
    .setName(name)
    .setDescription(description)
    .setRequired(required);

export default {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Interact with the NamelessSMP whitelist.")
    .setDefaultMemberPermissions(
      PermissionsBitField.Flags.BanMembers |
        PermissionsBitField.Flags.KickMembers,
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("add")
        .setDescription("Add a user to the whitelist.")
        .addUserOption(
          DiscordUser(
            "discord_user",
            "Discord user to bind the whitelist entry with.",
            true,
          ),
        )
        .addStringOption(AccountType(true))
        .addStringOption(
          MinecraftAccount(
            "minecraft_account",
            "The Minecraft account that will be added to the whitelist.",
            true,
          ),
        ),
    )
    .addSubcommandGroup(
      new SlashCommandSubcommandGroupBuilder()
        .setName("remove")
        .setDescription("Remove entries from the whitelist based on filters.")
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("account")
            .setDescription("Remove a Minecraft account from the whitelist.")
            .addStringOption(AccountType(true))
            .addStringOption(
              MinecraftAccount(
                "minecraft_account",
                "The Minecraft account that will be removed from the whitelist.",
                true,
              ),
            ),
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("user")
            .setDescription("Remove all of a Discord user's bound accounts.")
            .addUserOption(
              DiscordUser(
                "discord_user",
                "Discord user to remove all entries for.",
              ),
            ),
        ),
    )
    .addSubcommandGroup(
      new SlashCommandSubcommandGroupBuilder()
        .setName("query")
        .setDescription("Query entries from the whitelist based on filters.")
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("account")
            .setDescription("Query a Minecraft account's whitelist status.")
            .addStringOption(AccountType(true))
            .addStringOption(
              MinecraftAccount(
                "minecraft_account",
                "The Minecraft account to filter by.",
                true,
              ),
            ),
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("user")
            .setDescription("Query a Discord user's whitelist entries.")
            .addUserOption(
              DiscordUser(
                "discord_user",
                "The Discord user to filter by.",
                true,
              ),
            ),
        ),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("list")
        .setDescription("Show a list of all whitelist Entries."),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("clear")
        .setDescription("WARNING: Clears the entire whitelist.")
        .addBooleanOption(
          new SlashCommandBooleanOption()
            .setName("confirm")
            .setDescription(
              "Enable this flag to allow the command to run. WARNING: No going back!",
            ),
        ),
    ),
  execute: newSubcommandHandler([
    {
      name: "/add",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("discord_user", true);
        const account = args.getString("minecraft_account", true);
        const type = args.getString("account_type", true);
        const entry = await whitelist
          .add(user.id, account, type)
          .catch(async (err) => {
            await interaction.editReply(err.message);
          });
        if (!entry) return;
        const embed = makeEntryEmbed(entry);
        await interaction.editReply({ embeds: [embed] });
      },
    },
    {
      name: "remove/account",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const type = args.getString("account_type", true);
        const account = args.getString("minecraft_account", true);
        const result = await whitelist.removeOne({
          minecraft_username: {
            $regex: type === "bedrock" ? `.${account}` : account,
            $options: "i",
          },
        });
        if (!result.acknowledged)
          return await interaction.editReply(
            "Something went wrong, please try again.",
          );
        else if (result.deletedCount > 0)
          return interaction.editReply(
            `Successfully removed ${result.deletedCount} entries from the whitelist.`,
          );
        else
          return interaction.editReply("No entries found with those filters.");
      },
    },
    {
      name: "remove/user",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("discord_user", true);
        const result = await whitelist.removeMany({ discord_id: user.id });
        if (!result.acknowledged)
          return await interaction.editReply(
            "Something went wrong, please try again.",
          );
        if (result.deletedCount > 0)
          return interaction.editReply(
            `Successfully removed ${result.deletedCount} entries from the whitelist.`,
          );
        return interaction.editReply("No entries found with those filters.");
      },
    },
    {
      name: "query/account",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const type = args.getString("account_type", true);
        const account = args.getString("minecraft_account", true);
        const data = await whitelist.queryOne({
          minecraft_username: {
            $regex: type === "bedrock" ? `.${account}` : account,
            $options: "i",
          },
        });
        if (!data)
          return await interaction.editReply(
            "This account is not in the whitelist.",
          );
        const embed = makeEntryEmbed(data);
        await interaction.editReply({ embeds: [embed] });
      },
    },
    {
      name: "query/user",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const user = args.getUser("discord_user", true);
        const data = await whitelist.queryMany({ discord_id: user.id });
        if (data.length === 0)
          return await interaction.editReply(
            "This user has no whitelist entries.",
          );
        const embed = makeEntryListEmbed(data);
        await interaction.editReply({
          embeds: [embed],
        });
      },
    },
    {
      name: "/list",
      execute: async ({ interaction }) => {
        await interaction.deferReply({ ephemeral: true });
        const limit = 20;
        let skip = 0;
        let total = await whitelist.count({});
        if (total === 0)
          return await interaction.editReply("No entries found.");
        const embed = async () => {
          const data = await whitelist.queryManyPaginated({}, skip, limit);
          const embed = makeEntryListEmbed(
            data,
            "Nameless SMP Whitelist Entries",
          );
          embed.setFooter({
            text: `Page ${Math.floor(skip / limit) + 1} of ${Math.ceil(total / limit)} - ${data.length} ${data.length === 1 ? "entry" : "entries"} of ${total} total.`,
          });
          return embed;
        };
        if (total <= limit) {
          // Why make a book if you only have one page
          return await interaction.editReply({ embeds: [await embed()] });
        }
        const PreviousPage = new ButtonBuilder()
          .setLabel("Previous")
          .setEmoji("⬅️")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("prev");
        const NextPage = new ButtonBuilder()
          .setLabel("Next")
          .setEmoji("➡")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("next");
        const Buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          PreviousPage,
          NextPage,
        );
        const reply = await interaction.editReply({
          embeds: [await embed()],
          components: [Buttons],
        });
        const collector = reply.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60 * 1000,
        });
        collector.on("collect", async (collected) => {
          collector.resetTimer();
          await collected.deferUpdate();
          const offset = collected.customId === "next" ? limit : -limit;
          if (skip + offset < 0 || skip + offset >= total)
            return console.log("[whitelist] /list: out of bounds -");
          skip += offset;
          await interaction.editReply({
            embeds: [await embed()],
            components: [Buttons],
          });
        });
        collector.on("end", async () => {
          // Disable buttons
          PreviousPage.setDisabled(true);
          NextPage.setDisabled(true);
          await interaction.editReply({
            content: "Run this command again to continue scrolling the pages.",
            embeds: [await embed()],
          });
        });
      },
    },
    {
      name: "/clear",
      execute: async ({ interaction, args }) => {
        await interaction.deferReply({ ephemeral: true });
        const confirm = args.getBoolean("confirm", false);
        if (!confirm)
          return await interaction.editReply(
            "Are you sure you want to clear the whitelist? If so please rerun the command with the confirm option set to true.",
          );
        const result = await whitelist.removeMany({});
        if (!result.acknowledged)
          return await interaction.editReply(
            "Something went wrong, please try again.",
          );
        if (result.deletedCount > 0)
          return interaction.editReply(
            `Successfully removed ${result.deletedCount} entries from the whitelist.`,
          );
        return interaction.editReply("The whitelist is already empty.");
      },
    },
  ]),
} satisfies CommandData;
