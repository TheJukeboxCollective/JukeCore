eventListen("battlePageLoad", async () => {
	let battleTitle = new Elem("battle-title")
	let battleDesc = new Elem("battle-desc")
	let battleStatus = new Elem("battle-status")


	let battle_id = window.location.pathname.split("/")[2]
	let battleObj = await JukeDB.BattleDB.get(battle_id)


	battleTitle.text = battleObj.title
	battleDesc.text = battleObj.desc


	let voteTime = battleObj.endTime+((battleObj.endTime - battleObj.startTime)/2)
	let submitCont = new Elem("file-upload-cont")
	let tracksCont = new Elem("song-cont")
	submitCont.style = "display: none;"
	tracksCont.style = "display: none;"

	if (Date.now() < battleObj.endTime) {
		battleStatus.setAttr("state", "active")
		submitCont.style = ""
	} else if (Date.now() < voteTime) {
		battleStatus.setAttr("state", "voting")
		tracksCont.style = ""
	} else {
		battleStatus.setAttr("state", "complete")
		tracksCont.style = ""
	}


	// SUBMIT THE FILE LES GOO
	let uploadInput = new Elem("upload-input")
	print(uploadInput)

	uploadInput.on("change", async e => {
		print('mmmmkay')
		var file = e.target.files[0]
		var stream = file.stream()
		var reader = stream.getReader()

		await socket.emitWithAck("upload", "test", file.name, {type: "start", battle: battleObj})

		var fileSize = 0
		reader.read().then(async function loop({ done, value }) {
			if (done) {
				print("done I guess ", fileSize)
				await socket.emitWithAck("upload", "test", file.name, {type: "done"})
				return
			}

			// fileSize += value.length
			// print(value)
			await socket.emitWithAck("upload", "test", file.name, {type: "data", data: value})

			return reader.read().then(loop)
		})
	})

	let uploadButton = new Elem("upload-button")
	uploadButton.on("click", e => {
		uploadInput.elem.click()
	})


	// Ok, stop loading
	let loadingIcon = new Elem("loading-icon")
	loadingIcon.style = "display: none;"

	let loadConetnt = new Elem("load-content")
	loadConetnt.style = ""
})