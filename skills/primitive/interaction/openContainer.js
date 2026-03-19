module.exports = {
  name: "openContainer",
  description: "Open a container block by name (e.g. chest, furnace). Returns the container object if successful, or null if no matching container is found within range.",

  parameters: {
    blockName: "string"
  },

  execute: async (bot, { blockName }) => {
    const block = bot.findBlock({
    matching: b => b.name.includes(blockName),
    maxDistance: 6 })

    if (!block) return null

    return await bot.openContainer(block)
  }
}