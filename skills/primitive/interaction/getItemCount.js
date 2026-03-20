module.exports = {
  name: "getItemCount",
  description: "Get the count of a specific item in the inventory. Useful for checking if you have enough materials before crafting or building.",

  parameters: {
    itemName: "string"
  },

  execute: async (bot, { itemName }) => {
    const item = bot.inventory.items().find(i => i.name.includes(itemName))
    return item ? item.count : 0
  }
}