const print = console.log
const { SlashCommandBuilder } = require('discord.js')
const PC_CAT_ID = process.env['pcat']
const AR_CAT_ID = process.env['acat']
const { MemberDB, ChannelDB } = require("../../jukedb.js")
const JukeUtils = require("../../jukeutils.js")
const PERMS = require("../perms.js")

const COMMAND_INFO = {
	name: "channel",
	description: "Creates a personal channel"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

command.addStringOption(option => option.setName("name")
	.setDescription("Name of your PC"))

///////////////////////////////////////////

async function execute(interaction) {
	let {user, client} = interaction
	let userObj = await MemberDB.get(user.id)
	print(userObj)
	let PC_ID = userObj.channel
	// print(PC_ID)
	var promDefer = interaction.deferReply({ephemeral: true})

	async function makePC() {
		let name_option = interaction.options.get("name")
		let channel_name = (name_option ? name_option.value : `${interaction.member.displayName}-pc`)
		let this_pc = await interaction.guild.channels.create({
			parent: PC_CAT_ID,
			name: channel_name,
			permissionOverwrites: [
				{
					id: interaction.member.id,
					allow: [PERMS.OWNER]
				}
			]
		})
		await promDefer
		var promSet = MemberDB.set(user.id, "channel", this_pc.id)
		var promEdit = interaction.editReply(`🎉 **Your PC has been made! <#${this_pc.id}>** 🎉\n*(You have permissions to edit the channel as you please!)*`)
		await Promise.all([promSet, promEdit])
	}

	if (PC_ID == null) {
		await makePC()
	} else {
		let this_pc = await client.channels.fetch(PC_ID)
		if (this_pc.parent.id == AR_CAT_ID) {
			// await Promise.all([DBupdate, PCdeletion])
			await makePC()
			await this_pc.delete()
		} else {
			await promDefer
			await interaction.editReply({
				content: "‼ **You can't own multiple PCs!!** ‼\n*(You have to \`\`/archive\`\` your current one to make a new one)*",
				ephemeral: true
			})
		}
	}
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}