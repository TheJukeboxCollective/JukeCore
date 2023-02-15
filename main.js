const print = console.log
const fs = require('node:fs')
require('dotenv').config({ path: `${__dirname}/.env` })
const token = process.env['token']

const { Client, IntentsBitField } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags) })

require("./bot/main.js")(client)
require("./site/main.js")(client)

client.login(token)