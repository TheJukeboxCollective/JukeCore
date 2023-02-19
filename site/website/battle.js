onNewPage(() => {
	if (window.location.pathname.split("/")[1] == "battle") {
		async function check() {
			if (document.getElementById("upload-input") != null) {
				let uploadInput = new Elem("upload-input")
				print(uploadInput)

				uploadInput.on("change", async e => {
					print('mmmmkay')
					var file = e.target.files[0]
					var stream = file.stream()
					var reader = stream.getReader()

					await socket.emitWithAck("upload", "test", file.name, {type: "start"})

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

				// Load Battles
				var battlesCont = new Elem("battles-cont")

				var battles = await JukeDB.BattleDB.getActive()

				battles.forEach(battle => {
					var battleCont = new Elem("div")
					battleCont.style = "background: #454545"

					var battleTitle = new Elem("p")
					battleTitle.text = battle.title
					battleCont.addChild(battleTitle)

					var battleDesc = new Elem("p")
					battleDesc.text = battle.desc
					battleCont.addChild(battleDesc)

					battlesCont.addChild(battleCont)
				})
			} else {
				setTimeout(check,1)
			}
		}

		check()
	}
})