module.exports = {
  name: "mineBlock",
  description: "Mine a specific block type. Example: mineBlock('wood_log', 3) will mine up to 3 wood blocks within a reasonable distance.",

  parameters: {
    blockName: "string",
    count: "number"
  },

  execute: async (bot, { blockName, count = 1 }) => {
    const blocks = bot.findBlocks({
      matching: (b) => b.name.includes(blockName+''),
      maxDistance: 10,
      count: count
    })
    if (!blocks.length) return `No blocks of type '${blockName}' found.`
    let mined = 0
    for (const pos of blocks) {
      const block = bot.blockAt(pos)
      if (!block) continue
      try {
        await bot.dig(block)
        mined++
      } catch (err) {
        return `Failed to mine block at ${pos.x},${pos.y},${pos.z}: ${err.message}`
      }
    }
    return `Mined ${mined} block(s) of type '${blockName}'.`
  }
}