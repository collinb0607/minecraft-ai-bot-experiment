const Vec3 = require('vec3')

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

    // Failsafe: check if bot is moving
    let lastPos = bot.entity.position.clone()
    let stuck = false
    const checkInterval = 500 // ms
    let elapsed = 0
    const maxTime = 10000 // 10 seconds

    while (elapsed < maxTime && bot.entity.position.distanceTo(new Vec3(x, y, z)) > 1) {
      await new Promise(res => setTimeout(res, checkInterval))
      const currentPos = bot.entity.position
      if (currentPos.distanceTo(lastPos) < 0.1) {
        elapsed += checkInterval
      } else {
        // Bot moved, reset timer
        elapsed = 0
        lastPos = currentPos.clone()
      }
    }
    if (elapsed >= maxTime) {
      throw new Error('Failed to move: Bot is stuck or blocked.')
    }

    return `Moved to (${x}, ${y}, ${z})...`
  }
}