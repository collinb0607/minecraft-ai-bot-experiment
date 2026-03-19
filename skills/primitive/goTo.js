module.exports = {
  name: "goTo",
  description: "Move the bot to a specific (x, y, z) position",

  parameters: {
    x: "number",
    y: "number",
    z: "number"
  },

  execute: async (bot, { x, y, z }) => {
    const { goals } = require('mineflayer-pathfinder')
    const goal = new goals.GoalBlock(x, y, z)
    await bot.pathfinder.goto(goal)
    return true
  }
}