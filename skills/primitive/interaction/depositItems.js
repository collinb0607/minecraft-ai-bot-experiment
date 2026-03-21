module.exports = {
  name: "depositItems",
  description: "Deposit items into a nearby container (e.g. chest, furnace). Depositing into a chest to free up inventory space is a common use case, but this can also be used to put items into a furnace for smelting. Example: depositItems('chest', { 'dirt': 64, 'cobblestone': 32 })",

  parameters: {
    container: "string",
    items: "object"
  },

  execute: async (bot, { container, items }) => {
    let block = bot.findBlock({
      matching: (b) => b.name.includes(container),
      maxDistance: 10,
      count: 1
    })

    if (!block) throw new Error(`No container found matching "${container}" within range.`)

    if (typeof items === 'string') items = JSON.parse(items.replace(/'/g, '"'))
    
    const openedContainer = await bot.openContainer(block)
    for (const [itemName, count] of Object.entries(items)) {
      const item = bot.inventory.items().find(i => i.name.includes(itemName))
      console.log(`Depositing ${count} of ${itemName} into ${container}...`)
      if (item) {
        await openedContainer.deposit(item.type, 0, count)
      }
    }
    await bot.waitForTicks(20) // Wait a moment for items to transfer
    await openedContainer.close()

    return `Deposited items into container: ${JSON.stringify(items)}.`
  }
}