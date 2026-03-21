const Bot = require('./bot');

const username = process.argv[2];
const host = process.argv[3];
const port = process.argv[4];

let options = {};
if (host) options.host = host;
if (port) options.port = parseInt(port);

if (!username) {
	console.error('Usage: node main.js <username> [options]');
    console.error('Example: node main.js Steve_Bot \'{"host": "localhost", "port": 25565}\'');
	process.exit(1);
}

const botInstance = new Bot(username, { ...options });