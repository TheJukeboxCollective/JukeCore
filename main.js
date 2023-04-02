global.print = console.log

require('dotenv').config({ path: `${__dirname}/.env` })

const fs = require('node:fs')
const token = process.env['token']

const { Client, IntentsBitField, Partials } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags), partials: Object.values(Partials) })

require("./events.js")
require("./arrayLib.js")
require("./bot/main.js")(client)
require("./site/main.js")(client)

//// Console Commands ////
require("./consoleCommands.js")(client)

client.login(token)