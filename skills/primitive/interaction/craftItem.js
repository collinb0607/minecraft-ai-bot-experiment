module.exports = {
  name: "craftItem",
  description: "Craft a specific item by name and amount. Example: craftItem(wooden_pickaxe, 1) will craft one wooden pickaxe if you have the necessary materials.",

  parameters: {
    itemName: "string",
    amount: "number"
  },

  execute: async (bot, { itemName, amount }) => {
    const recipe = bot.recipesFor(
      bot.registry.itemsByName[itemName].id,
      null,
      1,
      null
    )
    if (!recipe) return `No recipe found to craft '${itemName}'.`

    await bot.craft(recipe, amount, null)
    return true
  }
}