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
	var textWidth = measureText(userName.text).width
	if (textWidth > 60) {
		userName.style.setProperty("font-size", (72*(60/textWidth)))
	}

	let userIcon = new Elem("user-icon")
	userIcon.setAttr("src", userObjcord.displayAvatarURL+"?size=1024")

	let jukesBalance = new Elem("balance-jukes")
	let boxesBalance = new Elem("balance-boxes")
	jukesBalance.text = userObjDB.jukes.toLocaleString("en-US")
	boxesBalance.text = userObjDB.boxes.toLocaleString("en-US")

	let places = ["golds", "silvers", "bronzes"]
	places.forEach(place => {
		let placeElem = new Elem(`placings-${place}`)
		placeElem.setAttr("count", userObjDB[place])
	})

	let channelName = new Elem("channel-name")
	if (PcObjcord != null) {
		channelName.text = ("🖥 "+PcObjcord.name)
		channelName.href = `https://discord.com/channels/${JukeBot.guild}/${ENV["pc_chl"]}/threads/${userObjDB.channel}`
		channelName.setAttr("target", "_blank")
		let channelLikes = new Elem("channel-likes")
		channelLikes.setAttr("count", await JukeBot.PClikes(userObjDB.channel))
	} else {
		channelName.text = ("🖥 No Personal Channel...")
		channelName.setAttr("no_channel", "")
	}


	document.title = `@${userName.text} 🎶 <JukeBox>`

	let badgesCont = new Elem("badges-cont")
	let noBadgesInd = new Elem("no-badges")

	// let badges = [
	// 	"PKMN M&M 2022", "DEV", 
	// 	"PKMN M&M 2022", "DEV", 
	// 	"PKMN M&M 2022", "DEV", 
	// 	"PKMN M&M 2022", "DEV", 
	// 	"PKMN M&M 2022", "DEV", 
	// ]
	let badges = await MemberDB.validBadges(userObjDB)
	if (badges.length > 0) {
		noBadgesInd.style = "display: none;"
		badges.forEach(badge => {
			print(badge)
			let badgeElem = new Elem("img")
			badgeElem.setAttr("src", `${badge}.png`)
			badgesCont.addChild(badgeElem)
		})
	} else {
		noBadgesInd.style = ""
		badgesCont.style = "grid-template-columns: 100%; grid-template-rows: 100%; align-items: center;"
	}

	let userBadges = new Elem("user-badges")
	userBadges.text = `🎖️ Badges (${badges.length})`
})