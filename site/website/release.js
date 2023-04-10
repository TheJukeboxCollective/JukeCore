eventListen("releasePageLoad", async () => {
	var releaseCode = window.location.pathname.split("/")[2]
	var res = await socket.emitWithAck("getRelease", releaseCode)
	print(res)

	var style = new Elem("release-style")
	style.elem.sheet.insertRule(`body { background-image: url("${res.cover.file.url}") }`)

	/// Title Logo ///
	var titleLogoElem = new Elem("title-logo")
	titleLogoElem.style.setProperty("background-image", `url("${res.properties["Title Logo"].files[0].file.url}")`)

	/// Description ///
	var descriptionElem = new Elem("description")
	descriptionElem.text = res.properties["Description"].rich_text[0].plain_text

	/// Links ///
	for (var i = 0; i < 4; i++) {
		var link = res.properties[`LINK #${i+1}`].url
		if (link != null) {
			var linkElem = spawnLinkIcon(link)
			linkElem.classes.add("link")
			new Elem("links").addChild(linkElem)
		}
	}

	/// Participants ///
	res.properties[`Participants`].relation.forEach(async obj => {
		var artistInfo = await socket.emitWithAck("getNotionMember", obj.id)
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