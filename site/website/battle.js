eventListen("battlePageLoad", async () => {
	let battleTitle = new Elem("battle-title")
	let battleDesc = new Elem("battle-desc")
	let battleStatus = new Elem("battle-status")


	let battleID = window.location.pathname.split("/")[2]
	let battleObj = await JukeDB.BattleDB.get(battleID)


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

	async function updloadSubmission(songID) {
		print('Starting upload to server...')
		var file = uploadInput.elem.files[0]
		var stream = file.stream()
		var reader = stream.getReader()


		var fileSize = 0
		reader.read().then(async function loop({ done, value }) {
			if (done) {
				await socket.emitWithAck("uploadSong", songID, {type: "done"})
				print("Upload complete: ", fileSize)
				return
			}

			// fileSize += value.length
			await socket.emitWithAck("uploadSong", songID, {type: "data", data: value})
			print("Data sent...")

			return reader.read().then(loop)
		})
	}

	let titleInput = new Elem("song-title-input")
	let addCollabButton = new Elem("add-collaborator-button")
	let removeCollabButton = new Elem("remove-collaborator-button")
	let collabGroup = new Elem("collab-group")
	let submitButton = new Elem("submit-button")

	async function loadMembers(argument) {
		var members = await JukeBot.getMembers()
		var memberList = new Elem("datalist")
		memberList.id = "member-list"

		members.forEach(member => {
			let thisOption = new Elem("option")
			thisOption.text = member.id
			thisOption.setAttr("value", member.tag)

			memberList.addChild(thisOption)
		})
		new Elem("upload-song-info").addChild(memberList)


		return members
	}

	let uploadButton = new Elem("upload-button")
	var parseMembers = {}
	uploadButton.on("click", async e => {
		uploadInput.elem.click()
		var members = await loadMembers()
		members.forEach(member => parseMembers[member.tag] = member.id)

		addCollabButton.on("click", e => {
			var collabInput = new Elem("input")
			collabInput.setAttr("placeholder", "Select collaborator...")
			collabInput.setAttr("list", "member-list")
			collabGroup.addChild(collabInput)
		})
		removeCollabButton.on("click", e => {
			let lastChild = collabGroup.children.last()
			if (lastChild) { lastChild.delete() }
		})

		uploadButton.style.setProperty("display", "none")
		new Elem("upload-song-info").style.removeProperty("display")
	})

	submitButton.on("click", async e => {
		let songID = await socket.emitWithAck("genSongID")
		let collaborators = collabGroup.children.map(elem=>(parseMembers[elem.elem.value]))
		let res = await socket.emitWithAck("uploadSong", songID, {
			type: "start",
			battleID: battleID,
			title: titleInput.elem.value,
			length: uploadInput.elem.files[0].size,
			authors: [localStorage.getItem("userID")].concat(collaborators)
		})
		print(res)


		await updloadSubmission(songID)
	})


	// Ok, stop loading
	let loadingIcon = new Elem("loading-icon")
	loadingIcon.style = "display: none;"

	let loadConetnt = new Elem("load-content")
	loadConetnt.style = ""
})