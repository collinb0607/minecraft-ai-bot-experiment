module.exports = {
  name: "lookAtLocation",
  description: "Make the bot look at a specific x, y, z location",

  parameters: {
    x: "number",
    y: "number",
    z: "number"
  },

  execute: async (bot, { x, y, z }) => {
        await bot.lookAt(new Position(x, y, z))
    }
}
