require('dotenv').config({ path: `${__dirname}/.env` })

const print = console.log
const fs = require('node:fs')
const token = process.env['token']

const { Client, IntentsBitField, Partials } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags), partials: Object.values(Partials) })

require("./bot/main.js")(client)
// require("./site/main.js")(client)

//// Console Commands ////
require("./consoleCommands.js")(client)

client.login(token)