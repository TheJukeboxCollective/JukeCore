const { SlashCommandBuilder } = require('discord.js')
const JukeDB = require("../../jukedb.js")
const JukeUtils = require("../../jukeutils.js")

const COMMAND_INFO = {
	name: "play",
	description: "Plays the song OR Queues all songs in a battle using a given ID"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

command.addStringOption(option => option.setName('type')
	.setDescription("Are you queuing a song or a battle")
	.addChoices(
		choice("Song"),
		choice("Battle"),
	)
	.setRequired(true)
)

command.addStringOption(option => option.setName("id")
	.setDescription("ID of song or battle to queue")
	.setRequired(true)
)

///////////////////////////////////////////

async function execute(interaction) {
	await interaction.deferReply()

	var ID = interaction.options.get("id").value
	var type = interaction.options.get("type").value

	var { member } = interaction
	var VCID = member.voice.channelId

	if (VCID) {
		await Music.init(VCID, interaction.channel.id)

		var ThisDB = JukeDB[`${type}DB`]
		var res = await ThisDB.get(ID)

		if (res != null) {
			switch (type) {
				case "Song":
					let queueInd = await Music.add_queue(res, VCID)
					if (queueInd != 0) {
						await interaction.editReply(`**Queued ${await JukeUtils.fancy_title(res)} at ${queueInd}**`)
					}
				break;
				case "Battle":
					if (Date.now() > res.endTime) {
						var songs = await ThisDB.getBattleSongs(res._id)
						await songs.asyncForEach(async song => {
							await Music.add_queue(song, VCID)
						})
						await interaction.editReply(`**Queued \`\`${songs.length}\`\` songs!**`)
					} else {
						await interaction.editReply(`‼ **Battle is still ongoing!** ‼`)
					}
				break;
			}
		} else {
			await interaction.editReply(`‼ **Not a valid ${type.toLowerCase()} ID** ‼`)
		}
	} else {
		await interaction.editReply(`‼ **You must be in a voice channel to use this command!** ‼`)
	}
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}