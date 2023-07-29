require('dotenv').config({ path: `${__dirname}/.env` })

global.DEBUG = (process.env["debug"] == "true")
// Use 'print' for debug messages
// Use 'log' for production messages
global.print = (...args) => {
	if (DEBUG) { console.log(...args) }
}
global.log = console.log

global.fs = require('node:fs')
const token = process.env['token']

const { Client, IntentsBitField, Partials } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags), partials: Object.values(Partials) })

global.JukeBotClient = client

require("./events.js")
require("./arrayLib.js")
require("./bot/main.js")(client)
require("./site/main.js")(client)

//// Console Commands ////
require("./consoleCommands.js")(client)

client.login(token)