// Stolen from the Jummbox Font Maker :)

const OAUTH_LINK = `https://discord.com/api/oauth2/authorize?client_id=1065987974296244224&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fhome&response_type=code&scope=identify%20guilds.join%20guilds`

var SubmitButton = new Elem("submit-button")

if (localStorage.getItem("access") != null) {
	SubmitButton.text = "Submit"
	SubmitButton.style.setProperty("background", "#5A1991")
	SubmitButton.href = "/submit"
} else {
	SubmitButton.text = "Login"
	SubmitButton.style.setProperty("background", "#5865F2")
	SubmitButton.href = OAUTH_LINK
}

var code = new URLSearchParams(window.location.search).get("code")
if (code != null && window.location.pathname.split("/").join("") == "home") {
	socket.emit("code", code)

	socket.on("userAccessInfo", async info => {
		localStorage.setItem("access", JSON.stringify(info))

		SubmitButton.text = "Submit"
		SubmitButton.style.setProperty("background", "#5A1991")
		SubmitButton.href = "/submit"
	})
}

if (window.location.pathname.split("/").join("") == "submit") {
	function check() {
		if (document.getElementById("upload-button") != null) {
			let uploadButton = new Elem("upload-button")

			uploadButton.on("click", e => {
				var input = document.createElement('input')
				input.type = 'file'

				input.onchange = async e => { 
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
				}

				input.click()
			})
		} else {
			setTimeout(check,1)
		}
	}

	check()
}