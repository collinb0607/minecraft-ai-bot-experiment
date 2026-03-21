module.exports = {
  name: "wander",
  description: "Make the bot wander around randomly. Only use this when the bot has nothing else to do.",

  parameters: { },

  execute: async (bot, { }) => {
    const x = bot.entity.position.x + (Math.random() * 20 - 10)
    const z = bot.entity.position.z + (Math.random() * 20 - 10)
    
    await bot.skills['goTo']({ x, y: bot.entity.position.y, z })
  }
}