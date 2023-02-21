// onNewPage(() => {
// 	if (window.location.pathname.split("/")[1] == "battles") {
// 		async function check() {
// 			if (document.getElementById("upload-input") != null) {
// 				let uploadInput = new Elem("upload-input")
// 				print(uploadInput)

// 				uploadInput.on("change", async e => {
// 					print('mmmmkay')
// 					var file = e.target.files[0]
// 					var stream = file.stream()
// 					var reader = stream.getReader()

// 					await socket.emitWithAck("upload", "test", file.name, {type: "start"})

// 					var fileSize = 0
// 					reader.read().then(async function loop({ done, value }) {
// 						if (done) {
// 							print("done I guess ", fileSize)
// 							await socket.emitWithAck("upload", "test", file.name, {type: "done"})
// 							return
// 						}

// 						// fileSize += value.length
// 						// print(value)
// 						await socket.emitWithAck("upload", "test", file.name, {type: "data", data: value})

// 						return reader.read().then(loop)
// 					})
// 				})


// 			} else {
// 				setTimeout(check,1)
// 			}
// 		}

// 		check()
// 	}
// })

eventListen("battlesPageLoad", async () => {
	// Load Battles
	var battlesCont = new Elem("battles-cont")

	var battles = await JukeDB.BattleDB.getAll()

	battles.sort((a, b) => {
		let theTime = Date.now()

		// Maybe automate this in the sheet using app script 
		let a_voting = (theTime < (a.endTime+((a.endTime - a.startTime)/2)) ? 1 : 0)
		let b_voting = (theTime < (b.endTime+((b.endTime - b.startTime)/2)) ? 1 : 0)

		let a_active = (theTime < a.endTime ? 1 : 0)
		let b_active = (theTime < b.endTime ? 1 : 0)

		if (a_voting != 0 || b_voting != 0) {
			return (b_voting - a_voting)
		} else if (a_active != 0 || b_active != 0) {
			return (b_active - a_active)
		} else {
			return (a.endTime - b.endTime)
		}
	})

	battles.forEach(battleObj => {
		var battleCont = new Elem("div")
		battleCont.classes.add("battle")

		var battleTitle = new Elem("p")
		battleTitle.text = battleObj.title
		battleTitle.classes.add("battle-title")

		var battleTime = new Elem("span")
		let voteTime = battleObj.endTime+((battleObj.endTime - battleObj.startTime)/2)
		let timeStamp = moment(battleObj.endTime).fromNow()
		let voteTimeStamp = moment(voteTime).fromNow()
		if (Date.now() < battleObj.endTime) {
			battleTime.text = `Submissions due ${timeStamp}`
		} else if (Date.now() < voteTime) {
			battleTime.text = `Voting due ${voteTimeStamp}`
		} else {
			battleTime.text = `Battle ended ${timeStamp}`
		}
		battleTime.classes.add("battle-time")
		battleTitle.addChild(battleTime)

		battleCont.addChild(battleTitle)

		var battleDesc = new Elem("p")
		battleDesc.text = battleObj.desc
		battleDesc.classes.add("battle-desc")
		battleCont.addChild(battleDesc)

		battleCont.on("click", e => {
			switchTo(`battle`, false, `battles/${battleObj.id}`)
		})

		battlesCont.addChild(battleCont)
	})
})