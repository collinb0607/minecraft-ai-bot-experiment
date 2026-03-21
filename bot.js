const mineflayer = require('mineflayer')
const { pathfinder, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const fs = require('fs')
const Vec3 = require('vec3')
const loadSkills = require('./lib/loader')
const skills = loadSkills(__dirname + '/skills')

class Bot {
    constructor(username, options = {}) {
        this.username = username
        this.host = options.host || '67.84.155.12'
        this.port = options.port || 25566
        this.memoryFile = `./memories/shortTermMemories/shortTermMemory_${username}.txt`
        this.personalityFile = `./personalities/personality_${username}.txt`
        this.maxMemories = options.maxMemories || 25
        this.memory = []
        this.automationEnabled = false
        this.botSpawned = false
        this.skills = skills
        this.initBot()
    }

    initBot() {
        this.bot = mineflayer.createBot({
            host: this.host,
            port: this.port,
            username: this.username
        })

        if(!fs.existsSync(this.personalityFile)) {
            fs.writeFileSync(this.personalityFile, `You are ${this.username}, a helpful and friendly Minecraft bot.`)
            this.log(`Created default personality file for ${this.username}. You can customize it at ${this.personalityFile}`)
        }

        this.bot.on('spawn', async () => { await this.spawnBot() })

        this.bot.on('chat', async (username, message) => { await this.chatBot(username, message) })
    }

    async spawnBot() {
        this.log(`${this.username} loading plugins...`)
        this.bot.loadPlugin(pathfinder)
        this.bot.loadPlugin(collectBlock)

        this.log(`${this.username} registering skills...`)
        this.bot.skills = {}
        for (const [name, skill] of Object.entries(this.skills)) {
            this.bot.skills[name] = (args = {}) => skill.execute(this.bot, args)
        }
        this.log(`${this.username} has ${Object.keys(this.bot.skills).length} skills registered.`)
        this.log(`Skills: ${Object.keys(this.bot.skills).join(', ')}`)

        this.log(`${this.username} initializing memory...`)
        fs.writeFileSync(this.memoryFile, '')
        this.log(`${this.username} has joined the server!`)
        this.botSpawned = true

        await this.bot.waitForTicks(20) // Greet nearest player on spawn
        const player = this.bot.nearestEntity(e => e.type === 'player')
        const entityTypes = [...new Set(Object.values(this.bot.entities).map(e => e.type))];

        /*if (player) {
            this.log(`Found nearest player: ${player.username}.`)
            this.log(await this.bot.skills['goTo']({ x: player.position.x, y: player.position.y, z: player.position.z }))
            await this.bot.lookAt(new Vec3(player.position.x, player.position.y + player.height - 0.3, player.position.z))
            this.bot.chat(`Hello ${player.username}, My name is ${this.bot.username}. Type '-commands' to see what I can do!`)
        }*/
        //this.automationLoop() 
    }

    async chatBot(username, message) {
        try {
            if (username === this.bot.username) return
            if (message.toLowerCase().trim() === '-commands') {
                this.bot.chat(`Here are the available commands: follow \nhello \nautomate \ncommands`)
                return
            }if (message.toLowerCase().trim() === '-hello') {
                this.bot.chat(`Hello, ${username}!`)
                return
            }if (message.toLowerCase().trim() === '-follow') {
                const player = this.bot.players[username]
                if (player) {
                    this.bot.lookAt(player.entity.position)
                    this.bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 1))
                    this.bot.chat('Following you!')
                    return
                }
            }if (message.toLowerCase().trim() === '-automate') {
                this.automationEnabled = !this.automationEnabled
                //this.automationLoop()
                this.bot.chat(`Automation ${this.automationEnabled ? 'enabled' : 'disabled'}!`)
                return
            }
            /*const reply = await this.askAI(
                `
                Personality:\n
                ${this.getPersonality()}\n\n
                Recent memory:\n
                ${this.getShortTermMemory()}\n\n
                Available skills:\n
                ${JSON.stringify(this.getSkillList(this.skills))}\n\n
                Environment:
                ${await this.getEnvironment()}\n\n
                
                Reply to the player's message in a single concise sentence.\n\n
                
                Player said: ${message}
                `
            )*/
            const reply = message
            //this.bot.chat(reply)
            this.updateShortTermMemory(`${username} said: ${message} | You replied: ${reply}`)
            this.log(`${username} said: ${message} | ${this.bot.username} replied: ${reply}`)
            const action = this.parseAction(reply)
            if (action.length !== 0){
                for (const act of action) {
                    await this.performAction(act)
                }
            }
        } catch (error) {
            this.logError('Error processing chat message: ', error)
            }
    }

    async askAI(prompt) {
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

    parseAction(text) {
        const match = text.match(/ACTION:\s*(.+)/)
        if (!match) return []
        const actionsStr = match[1]
        const actions = actionsStr.match(/(\w+\([^)]*\))/g) || []
        return actions
    }

    async performAction(action) {
        const match = action.match(/(\w+)\(([^)]*)\)/)
        if (!match) return
        const [, functionName, argsStr] = match
        const args = argsStr.split(',').map(arg => {
            arg = arg.trim()
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                arg = arg.slice(1, -1)
            }
            const num = parseFloat(arg)
            return isNaN(num) ? arg : num
        })
        if (this.bot.skills[functionName]) {
            const skill = this.skills[functionName]
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
                result = await this.bot.skills[functionName](paramObj)
                success = true
            } catch (err) {
                result = err.message || err.toString()
            }
            this.log(`Performed action: ${functionName} with args ${JSON.stringify(paramObj)}. Success: ${success}. Result: ${result}`)
            this.updateShortTermMemory(`SKILL: ${functionName}(${Object.values(paramObj).join(", ")}) RESULT: ${success} DETAILS: ${result}`)
            return result
        }
    }

    getPersonality() {
        const personality = fs.readFileSync(this.personalityFile, 'utf8')
        return personality
    }

    async getEnvironment() {
        const pos = this.bot.entity.position
        return `\n    
        Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)},\n    
        Health: ${this.bot.health},\n    
        Food: ${this.bot.food},\n    
        Time: ${this.bot.time.timeOfDay}\n    
        `
    }

    getSkillList(skills) {
        return Object.values(skills).map(skill => ({
            name: skill.name,
            description: skill.description,
            parameters: skill.parameters
        }))
    }

    getShortTermMemory() {
        const memory = fs.readFileSync(this.memoryFile, 'utf8')
        return memory
    }

    updateShortTermMemory(eventText) {
        const filePath = this.memoryFile
        let lines = []
        if (fs.existsSync(filePath)) {
            lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
        }
        if (lines.length > this.maxMemories*4) {
            lines = lines.slice(4)
            fs.writeFileSync(filePath, lines.join('\n'))
        }
        fs.appendFileSync(filePath, `\nTime: ${new Date().toLocaleString()}: ${eventText}`)
    }

    log(message) {
        console.log(new Date().toLocaleString() + ': ' + message);
    }

    logError(message) {
        console.error(new Date().toLocaleString() + ': ' + message);
    }

    /*async automationLoop(){
        if (!this.automationEnabled) return
        const decision = await this.askAI(`\nPersonality:\n${this.getPersonality()}\n\nRecent memory:\n${this.getShortTermMemory()}\n\nAvailable skills:\n${JSON.stringify(this.getSkillList(this.skills))}\n\nRespond EXACTLY like this using a single skill to perform an action that progresses toward the goal:\nTHOUGHT: ...\nACTION: goTo(x, y, z)`)
        this.log(`AI Decision (${this.username}): \n`, decision)
        this.updateShortTermMemory(decision)
        const action = this.parseAction(decision)
        for (const act of action) {
            await this.performAction(act)
            this.log(`Performed action: ${act}`)
        }
        setTimeout(() => this.automationLoop(), 2000)
    }*/
}

module.exports = Bot