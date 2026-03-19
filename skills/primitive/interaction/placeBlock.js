module.exports = {
  name: "placeBlock",
  description: "Place a block at a specific reference block and face vector.",

  parameters: {
    referenceBlock: "object",
    faceVector: "object",
    itemName: "string"
  },

  execute: async (bot, { referenceBlock, faceVector, itemName }) => {
    const item = bot.inventory.items().find(i => i.name.includes(itemName))
    if (!item) throw new Error("No block to place")

    await bot.equip(item, 'hand')
    await bot.placeBlock(referenceBlock, faceVector)
    }
}