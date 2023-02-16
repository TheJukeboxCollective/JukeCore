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

command.addStringOption(option => option.setName("description")
	.setDescription("Description/prompt of the JukeBattle")
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

command.addStringOption(option => option.setName('unit')
	.setDescription("What unit of time to use")		
	.addChoices(
		choice("hours"),
		choice("days"),
		choice("weeks"),
		choice("months"),
	)
	.setRequired(true)
)

///////////////////////////////////////////

async function execute(interaction) {
	interaction.deferReply()

	let title = interaction.options.get("title").value
	let desc = interaction.options.get("description").value
	let duration = interaction.options.get("duration").value
	let unit = interaction.options.get("unit").value

	let battleID = await JukeUtils.validID(BattleDB)
	print(battleID)

	await BattleDB.set(battleID, "title", title)
	await BattleDB.set(battleID, "desc", desc)
	await BattleDB.set(battleID, "host", interaction.user.id)

	let battleObj = await BattleDB.get(battleID)
	await BattleDB.set(battleID, "endTime", moment(battleObj.startTime).add(duration, unit).valueOf())
	battleObj = await BattleDB.get(battleID)

	await interaction.editReply(
		`⚔ **New Battle: \`\`${battleObj.title}\`\`** ⚔\n`
		+`**Desc:** ${battleObj.desc}\n`
		+`**Host:** <@${battleObj.host}>\n`
		+`**Due:** ${moment(battleObj.endTime).fromNow()}\n\n`
		+`*[ID: ${battleID}]*`
	)
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}