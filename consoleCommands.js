const print = console.log

const GUILD_ID = process.env['guild']
const JUKEBOXER_ROLE = process.env['jukeboxer_role']

var commands = {}

class ConsoleCommand {
	constructor(title, func) {
		this.title = title
		this.func = func	

		commands[title] = this
	}

	exec(args) {
		this.func(args)
	}
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.on("line", input => {
	var args = input.split(" ")
	var cmdname = args.shift()
	var command = commands[cmdname]
	if (command != null) {
		command.exec(args)
	}
})

module.exports = (client) => {
	new ConsoleCommand("ping", (args) => {
		print("pong!")
	})

	new ConsoleCommand("jukedm", async (args) => {
		let proms = []
		var guild = await client.guilds.fetch(GUILD_ID)

		if (args[0].startsWith("m:")) {
			let Bluto = await client.users.fetch("229319768874680320")
			if (Bluto.dmChannel == null) {
				await Bluto.createDM()
				Bluto = await Bluto.fetch()
			}
			print(Bluto.dmChannel)
			let refMessage = await Bluto.dmChannel.messages.fetch(args[0].split(":")[1])
			args = refMessage.content.split(" ")

			// 
		}
		await Array.from(guild.members.cache.values()).asyncForEach(async member => {
			if (member.roles.cache.has(JUKEBOXER_ROLE)) {
				var parsedMessage = args.map(arg => {
					arg = arg.replace("{user}", `<@${member.id}>`)
					arg = arg.replace("{username}", (member.user.username))
					arg = arg.replace("{Bluto}", `<@229319768874680320>`)
					arg = arg.replace("{}", `<@229319768874680320>`)
					return arg
				}).join(" ")

				try {
					await member.user.send(parsedMessage)
					print(`DM'd ${member.user.username}`)
				} catch(err) {
					print(`Some bitch probably blocked the bot: ${member.user.username}`)
				}
			}
		})

		// await Promise.all(proms)

		print("DM'd all JukeBoxers!")
	})
}