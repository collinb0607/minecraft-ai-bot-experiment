module.exports = {
  name: "collectDrops",
  description: "Collect all drops around the bot",

  parameters: { },

  execute: async (bot, {}) => {
    const items = Object.values(bot.entities)
    .filter(e => e.displayName === 'Item')

    for (const item of items) {
        await bot.pathfinder.goto(
        new (require('mineflayer-pathfinder').goals.GoalNear)(
        item.position.x,
        item.position.y,
        item.position.z,
        1
        )
        )
    }
  }
}