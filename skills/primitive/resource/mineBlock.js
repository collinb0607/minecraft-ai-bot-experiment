module.exports = {
  name: "mineBlock",
  description: "Mine a specific block type",

  parameters: {
    blockName: "string",
    count: "number"
  },

  execute: async (bot, { blockName, count = 1 }) => {
    const blocks = bot.findBlocks({
    matching: block => block.name === blockName,
    maxDistance: 32,
    count
    })

  for (const pos of blocks) {
    const block = bot.blockAt(pos)
    if (!block) continue
    await bot.dig(block)
    }
  }
}