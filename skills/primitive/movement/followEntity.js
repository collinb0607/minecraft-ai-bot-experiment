module.exports = {
  name: "followEntity",
  description: "Move the bot to follow a specific entity",

  parameters: {
    toFollow: "string",
    distance: "number"
  },

  execute: async (bot, { toFollow, distance }) => {
    const { goals } = require('mineflayer-pathfinder')
    const entity = bot.nearestEntity(e => e.name === toFollow) || bot.nearestEntity(e => e.username === toFollow)
    if (!entity) {
      throw new Error(`No entity found matching "${toFollow}"`)
    }
    const goal = new goals.GoalFollow(entity, distance)
    bot.pathfinder.setGoal(goal, true)
    return `Following ${toFollow} at a distance of ${distance}...`
  }
}