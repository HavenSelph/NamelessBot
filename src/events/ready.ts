import { Event } from "../structures/Event";

export default new Event("ready", () => {
  console.log(
    `Logged in successfully, and now running as of ${new Date().toLocaleTimeString()}`,
  );
});
