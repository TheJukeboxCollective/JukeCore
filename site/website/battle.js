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
		await submission.authors.asyncForEach(async author => {
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
	}

	if (Date.now() < battleObj.endTime) { //// ACTIVE ////
		battleStatus.setAttr("state", "active")
		submitCont.style = ""

		let submissions = await JukeDB.SongDB.getUserBattleSongs(localStorage.getItem("userID"), battleID)
		if (submissions.length > 0) {tracksCont.style.removeProperty("display"); new Elem("tracks-header").text = "Your Submitted Tracks:"}
		await submissions.asyncForEach(renderTrack)

		// SUBMIT THE FILE LES GOO
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

		let uploadInput = new Elem("upload-input")
		let uploadButton = new Elem("upload-button")
		let uploadResult = new Elem("upload-result")
		var parseMembers = {}

		if (localStorage.getItem("access") == null) {
			uploadButton.html = "Login"
			uploadButton.on("click", e => {
				window.open(new Elem("login-status").children[0].elem.href)
			})
		} else {
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
		}

		uploadInput.on("change", e => {
			print("CHANGE!")
			var bits = uploadInput.elem.files[0].name.split(".")
			delete bits[bits.length-1]
			bits.splice((bits.length-1), 1)
			songName = bits.join(".")
			print(songName)
			titleInput.elem.value = songName
		})

		submitButton.on("click", async e => {
			submitButton.style.setProperty("display", "none")
			if (uploadInput.elem.files[0] == null) { setResult(1, "Need to"); return }
			if (uploadInput.elem.files[0].size > 100e6) { setResult(1, "Submission size too big (tip: .mp3 files are smaller, but have less quality)"); return }
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


			await uploadSubmission(songID)
		})

		function setResult (...args) {
			var type = args.shift()
			var messages = args

			var makeType = (text, color) => ({text: text, color: color})
			const types = {
				0: makeType("Success!", "#8CD612"),
				1: makeType("Upload Error:", "#E03C28"),
			}
			var thisType = types[type]

			if (!Array.isArray(messages)) { messages = [messages] }

			let lines = [thisType.text].concat(messages)
			let fullMessage = lines.join("\n")

			uploadResult.style.removeProperty("display")
			uploadResult.style.setProperty("color", thisType.color)
			uploadResult.html = fullMessage
			print(uploadResult.text)
			alert(uploadResult.text)
		}

		async function uploadSubmission(songID) {
			print('Starting upload to server...')
			var file = uploadInput.elem.files[0]
			var stream = file.stream()
			var reader = stream.getReader()


			var progress = 0
			reader.read().then(async function loop(res) {
				var { done, value } = res

				async function doneProcess() {
					var errors = await socket.emitWithAck("uploadSong", songID, {type: "done"})
					// print("Upload complete: ", file.size)
					if (errors.length == 0) {
						setResult(0, "You can submit another by reloading the page!")
					} else {
						var e_msgs = []

						errors.forEach(error => {
							switch (error.type) {
								case "DUPE":
									print("UPLOAD ERROR: FILE ALREADY SUBMITTED TO BATTLE")
									e_msgs.push(`File already submitted to battle! Submit an issue in <a href="https://discord.com/channels/${ENV["guild"]}/${ENV["s_chl"]}" target="blank_">Support</a> if you think this is a mistake..`)
								break;
							}
						})
						setResult(1, ...[e_msgs])
					}
				}

				if (done) { await doneProcess(); return }

				progress += value.length
				let progPercent = `${((progress/file.size)*100)}%`
				new Elem("progress-bar").style.setProperty("--progress", progPercent)
				await socket.emitWithAck("uploadSong", songID, {type: "data", data: value})
				print("Data sent... ", progPercent)
				if (progress == file.size) { await doneProcess(); return }

				return reader.read().then(loop)
			})
		}

	} else if (Date.now() < voteTime) { //// VOTING ////
		battleStatus.setAttr("state", "voting")
		tracksCont.style = ""
		let submissions = await JukeDB.SongDB.getBattleSongs(battleID)
		await submissions.asyncForEach(renderTrack)
	} else { //// COMPLETE ////
		battleStatus.setAttr("state", "complete")
		tracksCont.style = ""
	}

	// Ok, stop loading
	let loadingIcon = new Elem("loading-icon")
	loadingIcon.style = "display: none;"

	let loadConetnt = new Elem("load-content")
	loadConetnt.style = ""
})