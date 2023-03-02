const print = console.log
const fs = require('node:fs')
const token = process.env['token']

const { Client, IntentsBitField } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags) })

require("./bot/main.js")(client)
require("./site/main.js")(client)

//// Testing Stuffs ////

// const { MemberDB, ChannelDB, BattleDB } = require("./jukedb.js")
// const JukeUtils = require("./jukeutils.js")
// var moment = require('moment')

// JukeUtils.validID(BattleDB).then(async battleID => {
// 	var battleObj = await BattleDB.setUp(battleID, {
// 		title: "Autostart Generated Battle!",
// 		desc: "This battle was generated at the start of the webapp",
// 		startTime: Date.now(),
// 		endTime: moment().add(2, "hours").valueOf()
// 	})

// 	print(battleObj)
// })

client.login(token)