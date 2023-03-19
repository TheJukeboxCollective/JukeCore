const print = console.log
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { MemberDB } = require("../../jukedb.js")
const JukeUtils = require("../../jukeutils.js")
const UserCard = require("../cards/userCard.js")

const GUILD_ID = process.env['guild']
const PC_CHANNEL = process.env['pc_chl']

const COMMAND_INFO = {
	name: "card",
	description: "Shows member's info, such as their jukes & boxes, badges, their Personal Channel, and tier emblem!"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

command.addUserOption(option => option.setName("member")
	.setDescription("Member who's card to display"))

///////////////////////////////////////////

async function execute(interaction) {
	await interaction.deferReply({ephemeral: true})
	let member = interaction.options.get("member")
	let user = (member ? member.user : interaction.user )

	if (user.bot) {
		let msg = await interaction.editReply({content: `**‼ ${user.username} is a bot ‼**`})
		setTimeout(() => {
			msg.delete()
		}, 3000)
	} else {
		// let res = [userDB.jukes, userDB.boxes]
		// await interaction.editReply(`__**${user.username}**'s Balance:__\n\n${JukeUtils.coinToEmote("jukes")} Jukes: **\`\`${res[0]}\`\`** ${JukeUtils.coinToEmote("jukes")}\n${JukeUtils.coinToEmote("boxes")} Boxes: **\`\`${res[1]}\`\`** ${JukeUtils.coinToEmote("boxes")}`)

		let res = await Promise.all([MemberDB.get(user.id), UserCard(interaction.client, user.id)])
		let userDB = res[0] 
		var buf = res[1]
		var attachName = `jukebox-member-card-${user.id}.png`
		const attachment = new AttachmentBuilder(buf, { name: attachName })

		/* No embed stupido
		var cardEmbed = new EmbedBuilder()
		.setTitle(`${user.username}'s Card`)
		.setImage(`attachment://${attachName}`)
		.setColor(0x7E2AD1)

		if (userDB.channel != null) { cardEmbed.setDescription(`**Personal Channel:** <#${userDB.channel}>`) }
		*/

		var comps = []

		if (userDB.channel != null) {
			var pcURL = `https://discord.com/channels/${GUILD_ID}/${userDB.channel}`

			const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					// .setCustomId('channeljump')
					.setLabel(`Jump to Member's PC`)
					.setEmoji("🖥")
					.setURL(pcURL)
					.setStyle(ButtonStyle.Link),
			);

			comps.push(row)
		}

		await interaction.editReply({files: [attachment], components: comps})
		// await interaction.editReply({embeds: [cardEmbed], files: [attachment]})
	}
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}