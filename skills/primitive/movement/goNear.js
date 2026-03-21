const Vec3 = require('vec3')

module.exports = {
  name: "goNear",
  description: "Move to a position adjacent (1 block away) to a target block. Example: goNear(10, 64, -5) will move you to a free block next to (10, 64, -5). This is especially useful for going near useful blocks like a chest or crafting table.",

  parameters: {
    x: "number",
    y: "number",
    z: "number"
  },

  execute: async (bot, { x, y, z }) => {
    const { goals } = require('mineflayer-pathfinder')
    const directions = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1)
    ]
    let found = false
    let targetPos = null
    for (const dir of directions) {
      const pos = new Vec3(x, y, z).plus(dir)
      const block = bot.blockAt(pos)
      if (block && block.boundingBox === 'empty') {
        found = true
        targetPos = pos
        break
      }
    }
    if (!found) throw new Error('No free adjacent block found near target.')
    const goal = new goals.GoalBlock(targetPos.x, targetPos.y, targetPos.z)
    await bot.pathfinder.goto(goal)

    // Failsafe: check if bot is moving
    let lastPos = bot.entity.position.clone()
    let stuck = false
    const checkInterval = 500 // ms
    let elapsed = 0
    const maxTime = 10000 // 10 seconds

    while (elapsed < maxTime && bot.entity.position.distanceTo(targetPos) > 1) {
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

    return `Moved near (${x}, ${y}, ${z}) at (${targetPos.x}, ${targetPos.y}, ${targetPos.z})...`
  }
}