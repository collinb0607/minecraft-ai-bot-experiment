module.exports = {
  name: "followEntity",
  description: "Move the bot to follow a specific entity",

  parameters: {
    entity: "object",
    distance: "number"
  },

  execute: async (bot, { entity, distance }) => {
    const { goals } = require('mineflayer-pathfinder')
    const goal = new goals.GoalFollow(entity, distance)
    bot.pathfinder.setGoal(goal, true)
    return true
  }
}
async function followEntity(bot, entity, distance = 2) {
  const { goals } = require('mineflayer-pathfinder')
  const goal = new goals.GoalFollow(entity, distance)
  
  bot.pathfinder.setGoal(goal, true)
}