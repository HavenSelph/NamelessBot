import { Event } from "../structures/Event";
import { whitelist } from "../index";

//fixme: if bot is offline while member leaves, they won't be removed from whitelist
// add a hourly or even longer update that checks all member ids against the database.

export default new Event("guildMemberRemove", async (member) => {
  const result = await whitelist.removeMany({
    discord_id: member.id,
  });
  if (result.acknowledged && result.deletedCount > 0) {
    console.log(
      `Removed ${result.deletedCount} entries for ${member.displayName} (${member.id}) from the whitelist.`,
    );
  }
});
