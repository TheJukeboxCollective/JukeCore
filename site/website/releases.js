eventListen("releasesPageLoad", async () => {
	var res = await socket.emitWithAck("getReleases")

	res.sort((a, b) => {
		var releaseValue = obj => moment(obj.properties["Release Date"].date.start)
		return releaseValue(b) - releaseValue(a)
	})

	print(res)

	/// Latest Release ///
	var latest = res.shift()
	print(latest)
	var latestElem = new Elem("latest")
	var latestTitleLogoElem = new Elem("latest-title-logo")
	latestElem.style.setProperty("background-image", `url("${latest.cover.file.url}")`)
	latestTitleLogoElem.elem.src = latest.properties["Title Logo"].files[0].file.url
	latestElem.setAttr("title", latest.properties["Name"].title[0].plain_text)
	latestElem.href = `/release/${latest.properties["Code"].rich_text[0].plain_text}`

	if (res.length > 0) {
		var pastReleaseCont = new Elem("past-cont")
		res.forEach(release => {
			var releaseElem = new Elem("a")
			var releaseIconElem = new Elem("img")
			releaseIconElem.elem.src = release.icon.file.url
			releaseElem.setAttr("title", release.properties["Name"].title[0].plain_text)

			releaseElem.addChild(releaseIconElem)
			releaseElem.href = `/release/${release.properties["Code"].rich_text[0].plain_text}`
			pastReleaseCont.addChild(releaseElem)

			pastReleaseCont.onclick = e => {
				switchTo()
			}
		})
	} else {
		new Elem("past-header").style.setProperty("display", "none")
	}

	// var style = new Elem("release-style")
	// style.elem.sheet.insertRule(`body { background-image: url("https://cdn.discordapp.com/attachments/518671807503532062/1094655846497128489/FtSL6K3XsAAOMv_.png") }`)
})