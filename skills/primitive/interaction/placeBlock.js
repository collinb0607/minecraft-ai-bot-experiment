const Vec3 = require('vec3')

module.exports = {
  name: "placeBlock",
  description: "Place a block at the specified coordinates." ,

  parameters: {
    x: "number",
    y: "number",
    z: "number",
    block: "string"
  },

  execute: async (bot, { x, y, z, block }) => {
    const blockItem = bot.inventory.items().find(i => i.name.includes(block))
    if (!blockItem) throw new Error("No block to place in inventory.")

    await bot.equip(blockItem, 'hand')

    const target = new Vec3(x, y, z)
    console.log(target)
    const ref = getPlacementReference(bot, target)

    if (!ref) throw new Error("No valid placement surface to place a block against.")

    await bot.placeBlock(ref.block, ref.face)
    }
}

function getPlacementReference(bot, position) {

  const directions = [
    new Vec3(0, -1, 0), // below
    new Vec3(0, 1, 0),  // above
    new Vec3(1, 0, 0),
    new Vec3(-1, 0, 0),
    new Vec3(0, 0, 1),
    new Vec3(0, 0, -1)
  ]

  for (const dir of directions) {
    const refPos = position.plus(dir)
    const block = bot.blockAt(refPos)

    if (block && block.boundingBox === 'block') {
      return {
        block,
        face: dir.scaled(-1)
      }
    }
  }

  return null
}