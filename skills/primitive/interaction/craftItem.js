module.exports = {
  name: "craftItem",
  description: "Craft a specific item by name and how many times you want to craft it. Example: craftItem(wooden_pickaxe, 1) will craft one wooden pickaxe if you have the necessary materials. craftItem('torch', 1) will craft 4 torches if you have the necessary materials.",

  parameters: {
    itemName: "string",
    amount: "number"
  },

  execute: async (bot, { itemName, amount }) => {
    const item = bot.registry.itemsByName[itemName]

    if (!item) throw new Error(`No item found matching "${itemName}"`)

    // Check if crafting table is nearby
    const craftingTable = bot.findBlock({
      matching: bot.registry.blocksByName.crafting_table.id,
      maxDistance: 20
    })

    if(craftingTable) await bot.skills['goNear']({ x: craftingTable.position.x, y: craftingTable.position.y, z: craftingTable.position.z })

    // Get recipes
    const recipes = bot.recipesFor(item.id, null, amount, craftingTable || null)

    if (recipes.length === 0) throw new Error(`No recipe found to craft "${itemName}". Make sure it is a craftable item, you have the necessary materials, and a crafting table if required.`)
    
    const recipe = recipes[0]
    try {
      await bot.craft(recipe, amount, craftingTable || null)
      return `Crafted the ${itemName} recipe ${amount} time(s).`
    } catch (err) {
      throw new Error(`Failed to craft "${itemName}": ${err.message}`)
    }
  }
}