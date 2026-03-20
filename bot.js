const mineflayer = require('mineflayer')
const { pathfinder, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const fs = require('fs')

let botSpawned = false
const maxMemories = 25
const loadSkills = require('./lib/loader')
const skills = loadSkills(__dirname + '/skills')

console.log(new Date().toLocaleString() + ': Starting Steve_Bot...')
const bot = mineflayer.createBot({
  host: '67.84.155.12', // or your server IP
  port: 25566,
  username: 'Steve_Bot'
})

bot.on('spawn', () => {
    console.log(new Date().toLocaleString() + ': Loading plugins...')
    bot.loadPlugin(pathfinder)
    bot.loadPlugin(collectBlock)
    
    console.log(new Date().toLocaleString() + ': Registering skills...')
    bot.skills = {}
    for (const [name, skill] of Object.entries(skills)) {
        bot.skills[name] = (args = {}) => skill.execute(bot, args)
    }

    console.log(new Date().toLocaleString() + ': Initializing memory...')
    fs.writeFileSync('shortTermMemory.txt', '')
    console.log(new Date().toLocaleString() + ': Steve_Bot has joined the server!')
    botSpawned = true
    automationLoop() // Start the automation loop immediately after spawning
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
    const match = text.match(/ACTION:\s*(.+)/)
    if (!match) return []
    
    const actionsStr = match[1]
    const actions = actionsStr.match(/(\w+\([^)]*\))/g) || []
    return actions
}

async function performAction(action) {
    const match = action.match(/(\w+)\((.*)\)/)
    if (!match) return
    
    const [, functionName, argsStr] = match
    const args = argsStr.split(',').map(arg => {
        arg = arg.trim()
        // Remove surrounding single or double quotes if present
        if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            arg = arg.slice(1, -1)
        }
        const num = parseFloat(arg)
        return isNaN(num) ? arg : num
    })
    
    if (bot.skills[functionName]) {
        // Map args to parameter names if available
        const skill = skills[functionName]
        let paramObj = {}
        if (skill && skill.parameters) {
            const paramNames = Object.keys(skill.parameters)
            paramObj = paramNames.reduce((obj, name, idx) => {
                obj[name] = args[idx]
                return obj
            }, {})
        } else {
            paramObj = { args }
        }
        let result, success = false
        try {
            result = await bot.skills[functionName](paramObj)
            success = result !== undefined ? result : true
        } catch (err) {
            result = err.message || err.toString()
            success = false
        }
        // Append result to memory
        updateShortTermMemory(`SKILL: ${functionName}(${Object.values(paramObj).join(", ")}) RESULT: ${success} DETAILS: ${result}`)
        return result
    }
}

function getPersonality() {
    const personality = fs.readFileSync('personality.txt', 'utf8')
    return personality
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

function getSkillList(skills) {
    return Object.values(skills).map(skill => ({
        name: skill.name,
        description: skill.description,
        parameters: skill.parameters
    }))
}

function getShortTermMemory() {
    const memory = fs.readFileSync('shortTermMemory.txt', 'utf8')
    return memory
}

function updateShortTermMemory(eventText) {
    const filePath = 'shortTermMemory.txt'
    let lines = []
    if (fs.existsSync(filePath)) {
        lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    }
    if (lines.length > maxMemories*4) {
        lines = lines.slice(4) // Remove the top 4 lines
        fs.writeFileSync(filePath, lines.join('\n'))
    }
    fs.appendFileSync(filePath, `\nTime: ${bot.time.timeOfDay}: ${eventText}`)
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
            automationLoop() // Start the loop immediately when enabling
            bot.chat(`Automation ${automationEnabled ? 'enabled' : 'disabled'}!`)
            return
        }
        const reply = await askAI(
            `Personality:
            ${getPersonality()}

            Recent memory:
            ${getShortTermMemory()}

            Available skills:
            ${JSON.stringify(getSkillList(skills))}
            
            Environment:${getEnvironment()}\n

            Reply to the player's message in a concise sentence. Then, if and only if the message contains an explicit request of you, respond with this format:
            
            Thought: ... (your thought process in understanding the message)
            ACTION: skillName(param1, param2)

            

            Player said: ${message}`
        )
        bot.chat(reply)
        const action = parseAction(reply)
        if (action.length !== 0){
            for (const act of action) {
                await performAction(act)
                console.log(`Performed action: ${act}`)
            }
        }
    } catch (error) {
        console.error('Error processing chat message:', error)
    }
})

async function automationLoop(){
    if (!automationEnabled) return
    const decision = await askAI(`
    Personality:
    ${getPersonality()}

    Recent memory:
    ${getShortTermMemory()}

    Available skills:
    ${JSON.stringify(getSkillList(skills))}

    Respond EXACTLY like this using a single skill to perform an action that progresses toward the goal:
    THOUGHT: ...
    ACTION: goTo(x, y, z)
    `)

    console.log("AI Decision: \n", decision)
    updateShortTermMemory(decision)
    const action = parseAction(decision)
    for (const act of action) {
        await performAction(act)
        console.log(`Performed action: ${act}`)
    }
    // Call itself again after finishing
    setTimeout(automationLoop, 2000); // Optional delay between actions
}
