eventListen("userPageLoad", async () => {
	const {MemberDB, ChannelDB} = JukeDB

	let userID = window.location.pathname.split("/")[2]
	let res = await Promise.all([
		MemberDB.get(userID),
		JukeBot.user(userID),
	])

	var userObjDB = res[0]
	var userObjcord = res[1]

	var PcObjDB;
	var PcObjcord;
	if (userObjDB.channel) {
		res = await Promise.all([
			ChannelDB.get(userObjDB.channel),
			JukeBot.channel(userObjDB.channel),
		])

		PcObjDB = res[0]
		PcObjcord = res[1]
	}

	print(userObjDB, userObjcord)

	let userName = new Elem("user-name")
	userName.text = (userObjDB.name || userObjcord.username)

	let jukesBalance = new Elem("balance-jukes")
	let boxesBalance = new Elem("balance-boxes")
	jukesBalance.text = userObjDB.jukes
	boxesBalance.text = userObjDB.boxes

	//// No placings in the database yet really really

	let channelName = new Elem("channel-name")
	channelName.text = ("#"+PcObjcord.name)
	channelName.href = `https://discord.com/channels/${JukeBot.guild}/${userObjDB.channel}`
	channelName.setAttr("target", "_blank")
	// no channel likes yet either, you're so useless


	document.title = `@${userName.text} 🎶 <JukeBox>`
})