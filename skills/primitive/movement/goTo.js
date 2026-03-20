module.exports = {
  name: "goTo",
  description: "Move the bot to a specific (x, y, z) position. This is only to move towards an interesting location, not to wander. Example: goTo(10, 64, -5)",

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