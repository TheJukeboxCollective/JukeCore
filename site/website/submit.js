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
	Discord("get", "users/@me").then(userObj => {
		print(userObj)
	})
}