eventListen("userPageLoad", async () => {
	const {MemberDB, ChannelDB} = JukeDB

	let userID = window.location.pathname.split("/")[2]
	let res = await Promise.all([
		MemberDB.get(userID),
		JukeBot.user(userID),
	])

	var userObjDB = (res[0] || {})
	var userObjcord = res[1]

	var PcObjcord;
	var pcLikes;
	var thisTier;
	var badges;
	res = await JukeBot.userPageInfo(userID)

	if (res != null) {
		PcObjcord = res[0]
		pcLikes = res[1]
		thisTier = res[2]
		badges = res[3]

		print(pcLikes)

		let userName = new Elem("user-name")
		userName.text = (userObjDB.name || userObjcord.username)
		var textWidth = measureText(userName.text).width
		if (textWidth > 60) {
			userName.style.setProperty("font-size", (72*(60/textWidth)))
		}

		let userIcon = new Elem("user-icon")
		print(userObjcord)
		userIcon.setAttr("src", userObjcord.displayAvatarURL+"?size=1024")

		if (thisTier.ind != 0) {
			let userEmblem = new Elem("user-emblem")
			userEmblem.setAttr("src", `emblems/emblem${thisTier.ind}.svg`)
			userEmblem.setAttr("style", ``)
		}

		let jukesBalance = new Elem("balance-jukes")
		let boxesBalance = new Elem("balance-boxes")
		jukesBalance.text = (userObjDB.jukes || 0).toLocaleString("en-US")
		boxesBalance.text = (userObjDB.boxes || 0).toLocaleString("en-US")

		let places = ["golds", "silvers", "bronzes"]
		places.forEach(place => {
			let placeElem = new Elem(`placings-${place}`)
			placeElem.setAttr("count", (userObjDB[place] || 0))
		})

		let channelName = new Elem("channel-name")
		let channelLikes = new Elem("channel-likes")
		if (PcObjcord != null) {
			channelName.text = ("🖥 "+PcObjcord.name)
			channelName.href = `https://discord.com/channels/${JukeBot.guild}/${ENV["pc_chl"]}/threads/${PcObjcord.id}`
			channelName.setAttr("target", "_blank")

			channelLikes.setAttr("count", pcLikes)
		} else {
			channelName.text = ("🖥 No Personal Channel...")
			channelName.setAttr("no_channel", "")

			channelLikes.setAttr("style", "display: none;")
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


		//// USER TRACKS ////
		var tracksCont = new Elem("song-cont")

		var cachedUserInfo = {}
		async function getUserInfo(id) {
			if (id in cachedUserInfo) {
				return cachedUserInfo[id]
			} else {
				var res = await Promise.all([
					JukeDB.MemberDB.get(id),
					JukeBot.user(id)
				])
				cachedUserInfo[id] = res
				return res
			}
		}

		async function renderTrack(submission) {
			var trackElem = new Elem("div")
			var trackTitleElem = new Elem("p")
			var trackAudioCont = new Elem("div")
			var trackAudioElem = new Elem("audio")

			var authors = [];
			print(submission.authors)
			await submission.authors.awaitForEach(async author => {
				print(author)

				var res = await getUserInfo(author)

				var dbObj = (res[0] || {})
				var cordObj = (res[1] || {})
				authors.push([dbObj, cordObj])
			})

			trackTitleElem.html = (
				`${authors.map(author => `<a href="/user/${author[1].id}">${(author[0].name || author[1].username)}</a>`).join(", ")}`+
				" - "+
				`${submission.title}`
			)
			trackTitleElem.classes.add("track-title")

			trackAudioElem.elem.src = `http://${window.location.host}/song/${submission._id}/`

			trackElem.addChild(trackTitleElem)
			trackAudioCont.addChild(trackAudioElem)
			trackElem.addChild(trackAudioCont)
			tracksCont.addChild(trackElem)

			new GreenAudioPlayer(trackAudioCont.elem, {
				showDownloadButton: true
			})

			trackAudioCont.children[3].children[0].on("click", e => {
				e.preventDefault()
				downloadFile(trackAudioElem.elem.src, `${trackTitleElem.text}.wav`)
			})

			var copyIDButton = new Elem(trackAudioCont.children[3].elem.cloneNode(true))
			// copyIDButton.elem.classList.remove("download")
			copyIDButton.children[0].on("click", e => {
				e.preventDefault()
				navigator.clipboard.writeText(submission._id)
			})
			trackAudioCont.addChild(copyIDButton)
		}

		var submissions = await JukeDB.SongDB.getPublicUserSongs(userID)
		submissions.sort((a,b) => (a.uploadDate - b.uploadDate))
		await submissions.awaitForEach(renderTrack)
	} else {
		window.open("/error", "_self")
	}
})