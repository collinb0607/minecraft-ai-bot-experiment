module.exports = {
  name: "equipItem",
  description: "Equip an item in the bot's inventory to a specific destination (hand, head, chest, legs, feet). Equipping an item will move it from the inventory to the specified slot, allowing the bot to use it (e.g. hold a sword, wear armor).",

  parameters: {
    itemName: "string",
    destination: "string"
  },

  execute: async (bot, { itemName, destination = 'hand' }) => {
    const item = bot.inventory.items().find(i => i.name.includes(itemName))
    if (!item) return false

    await bot.equip(item, destination)
    return true
  }
}