const print = console.log
const { SlashCommandBuilder } = require('discord.js')
const { MemberDB, ChannelDB, BattleDB } = require("../../jukedb.js")

const COMMAND_INFO = {
	name: "host",
	description: "Host a JukeBattle (Costs 10 Boxes)"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

// command.addStringOption(option => option.setName("placeholder")
// 	.setDescription("this is a placeholder option"))

///////////////////////////////////////////

async function execute(interaction) {
	interaction.reply(String(await MemberDB.size))
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}