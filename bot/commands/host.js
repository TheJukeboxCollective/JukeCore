const print = console.log
const { SlashCommandBuilder } = require('discord.js')
const { MemberDB, ChannelDB, BattleDB } = require("../../jukedb.js")
const JukeUtils = require("../../jukeutils.js")
var moment = require('moment')

const COMMAND_INFO = {
	name: "host",
	description: "Host a JukeBattle (Costs 10 Boxes)"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: String(val), value: val}}

command.addStringOption(option => option.setName("title")
	.setDescription("Title of the JukeBattle")
	.setRequired(true)
)

command.addIntegerOption(option => option.setName("duration")
	.setDescription("How long the battle lasts")
	.addChoices(
		choice(1),
		choice(2),
		choice(3),
		choice(4),
	)
	.setRequired(true)
)

command.addStringOption(option => option.setName('type')
	.setDescription("How long the battle lasts")		
	.addChoices(
		choice("add"),
		choice("remove")
	)
	.setRequired(true)
)

///////////////////////////////////////////

async function execute(interaction) {
	interaction.deferReply()

	let title = interaction.options.get("title").value

	let battleCount = await BattleDB.size
	let battleID = JukeUtils.toID(battleCount)
	await BattleDB.set(battleID, "title", title)

	await interaction.editReply(`battle '${title}' created..`)
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}