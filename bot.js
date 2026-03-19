const mineflayer = require('mineflayer')
const { pathfinder, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin

const GOAL = "Survive in Minecraft. Start by gathering wood, then craft wood planks, a crafting table, and some wooden tools."

const bot = mineflayer.createBot({
  host: '67.84.155.12', // or your server IP
  port: 25566,
  username: 'Steve_Bot'
})

bot.on('spawn', () => {
    bot.loadPlugin(pathfinder)
    bot.loadPlugin(collectBlock)
    console.log('Steve_Bot has joined the server!')
})

let automationEnabled = false
let memory = []

function addMemory(event) {
    memory.push(event)
    if (memory.length > 20) memory.shift()
}

async function askAI(prompt) {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3',
            prompt: prompt,
            stream: false
        })
    })
    const data = await response.json()
    return data.response
}

function parseAction(text) {
    const match = text.match(/ACTION:\s*(\w+)/)
    return match ? match[1] : null
}

async function getEnvironment() {
    const pos = bot.entity.position
    return `
    Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)},
    Health: ${bot.health},
    Food: ${bot.food},
    Time: ${bot.time.timeOfDay}
    `
}

async function executeAction(action) {
    switch (action) {
        case "CHOP_TREE":
        bot.chat("Getting wood!")
        await chopTree()
        break

        case "CRAFT_PLANKS":
        bot.chat("Crafting planks!")
        await craftPlanks()
        break

        case "CRAFT_TABLE":
        bot.chat("Crafting a crafting table!")
        await craftCraftingTable()
        break

        case "PLACE_TABLE":
        bot.chat("Placing the crafting table!")
        await placeCraftingTable()
        break

        case "EXPLORE":
        bot.chat("Exploring...")
        wander()
        break

        default:
        bot.chat("Thinking...")
  }
}

async function chopTree() {
    const block = bot.findBlock({
        matching: (b) => b.name.includes('log'),
        maxDistance: 32
    })

    if (!block) {
        console.log("Steve_Bot: No tree found nearby.")
        return
    }

    try { await bot.collectBlock.collect(block) } 
    catch { console.log("Steve_Bot: Failed to chop tree.") }
}

async function craftPlanks() {
    const log = bot.inventory.items().find(i => i.name.includes('log'))

    if (!log) {
        bot.chat("I need logs first.")
        return
    }

    const plankRecipe = bot.recipesFor(
        bot.registry.itemsByName.oak_planks.id,
        null,
        1,
        null
    )[0]

    if (!plankRecipe) {
        bot.chat("I don't know how to make planks.")
        return
    }

    await bot.craft(plankRecipe, 1, null)
    bot.chat("Made planks!")
}

async function craftCraftingTable() {
    const recipe = bot.recipesFor(
        bot.registry.itemsByName.crafting_table.id,
        null,
        1,
        null
    )[0]

    if (!recipe) {
        bot.chat("I can't craft a table yet.")
        return
    }

    await bot.craft(recipe, 1, null)
    bot.chat("Crafted a crafting table!")
}

async function placeCraftingTable() {
    const table = bot.inventory.items().find(i => i.name === 'crafting_table')

    if (!table) {
        bot.chat("No crafting table to place.")
        return
    }

    const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0))

    await bot.equip(table, 'hand')
    await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })

    bot.chat("Placed crafting table!")
}

async function wander() {
  const x = bot.entity.position.x + (Math.random() * 20 - 10)
  const z = bot.entity.position.z + (Math.random() * 20 - 10)

  const goal = new goals.GoalBlock(x, bot.entity.position.y, z)
  bot.pathfinder.setGoal(goal)
}

async function getItemCount(name) {
  const item = bot.inventory.items().find(i => i.name.includes(name))
  return item ? item.count : 0
}

bot.on('chat', async (username, message) => {
    try {
        if (username === bot.username) return
        if (message.toLowerCase().trim() === '-commands') {
            bot.chat(`Here are the available commands: follow \nhello \nautomate \ncommands`)
            return
        }if (message.toLowerCase().trim() === '-hello') {
            bot.chat(`Hello, ${username}!`)
            return
        }if (message.toLowerCase().trim() === '-follow') {
            const player = bot.players[username]
            if (player) {
            bot.lookAt(player.entity.position)
            bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 1))
            bot.chat('Following you!')
            return
            }
        }if (message.toLowerCase().trim() === '-automate') {
            automationEnabled = !automationEnabled
            bot.chat(`Automation ${automationEnabled ? 'enabled' : 'disabled'}!`)
            return
        }
        const reply = await askAI(
            `You are a Minecraft bot. If the player tells you to get wood, respond EXACTLY with: ACTION: CHOP_TREE Otherwise, respond normally.\n
            Environment:${getEnvironment()}\n
            Player said: ${message}`
        )
        if (reply.includes('ACTION: CHOP_TREE')) {
            bot.chat("I'm on it!")
            chopTree()
            console.log(`Player said: ${message}, Bot replied: ${reply}`)
            return
        } 
        console.log(`Player said: ${message}, Bot replied: ${reply}`)
        bot.chat(reply)
    } catch (error) {
        console.error('Error processing chat message:', error)
    }
})

setInterval(async () => {
    if (!automationEnabled) return
    const decision = await askAI(`
    You are a Minecraft survival bot.

    Goal:
    ${GOAL}

    Rules:
    - Be practical
    - Focus on survival
    - Take one step at a time

    Recent memory:
    ${memory.join('\n')}

    Available actions:
    - CHOP_TREE
    - CRAFT_PLANKS
    - CRAFT_TABLE
    - PLACE_TABLE
    - EXPLORE

    Respond EXACTLY like this using only available actions:
    THOUGHT: ...
    ACTION: ...

    Environment:
    ${getEnvironment()}
    `)

    console.log("AI Decision: \n", decision)
    addMemory(decision)
    const action = parseAction(decision)

    executeAction(action)
}, 10000)