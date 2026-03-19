module.exports = async function goTo(bot, position) {
  const { goals } = require('mineflayer-pathfinder')

  const goal = new goals.GoalBlock(position.x, position.y, position.z)
  await bot.pathfinder.goto(goal)

  return true
}