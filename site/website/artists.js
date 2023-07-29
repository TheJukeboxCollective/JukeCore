eventListen("artistsPageLoad", async () => {
	var artistInfos = await socket.emitWithAck("getAllNotionMembers")
	print(artistInfos)
	artistInfos = artistInfos.filter(info => (info.properties["In Collective"].checkbox && info.properties["Info Status"].status.name == "Verified"))
	artistInfos.sort((a, b) => {
		var aVal = a.properties["Name"].title[0].plain_text[0].toUpperCase().codePointAt(0)
		var bVal = b.properties["Name"].title[0].plain_text[0].toUpperCase().codePointAt(0)

		return aVal - bVal
	})
	artistInfos.forEach(artistInfo => {
		print(artistInfo)

		var artistCont = new Elem("div")
		artistCont.classes.add("artist-cont")

		// Icon
		if (artistInfo.icon) {
			var artistIconElem = new Elem("img")
			artistIconElem.classes.add("artist-icon")
			artistIconElem.elem.src = (artistInfo.icon.file || artistInfo.icon.external).url
			artistCont.addChild(artistIconElem)
		}

		var sideCont = new Elem("div")
		sideCont.classes.add("artist-side-cont")

		// Name
		var artistNameElem = new Elem("a")
		artistNameElem.href = `/user/${artistInfo.properties["Discord ID"].rich_text[0].plain_text}`
		artistNameElem.classes.add("artist-name")
		artistNameElem.text = artistInfo.properties["Name"].title[0].plain_text
		sideCont.addChild(artistNameElem)
		
		// Links
		var linkCont = new Elem("div")
		linkCont.classes.add("artist-link-cont")
		for (var i = 0; i < 5; i++) {
			var link = artistInfo.properties[`LINK #${i+1}`].url
			if (link != null) {
				var linkElem = spawnLinkIcon(link)
				linkElem.classes.add("artist-link")
				linkCont.addChild(linkElem)
			}
		}
		sideCont.addChild(linkCont)

		artistCont.addChild(sideCont)
		new Elem("artists-cont").addChild(artistCont)
	})
})