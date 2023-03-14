(async () => {
const OAUTH_LINK = `https://discord.com/api/oauth2/authorize?client_id=1065987974296244224&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fhome&response_type=code&scope=identify%20guilds.join%20guilds`

var profileStatus = new Elem("login-status")

async function loggedIn() {
	let userObj = await Discord("get", "users/@me")
	if (userObj != null) {
		let userObjDB = await JukeDB.MemberDB.get(userObj.id)
		profileStatus.html = `Logged in as<br><a style="color: #ffffff;">${(userObjDB.name || userObj.username)}</a>`
		profileStatus.children[1].href = `/user/${userObj.id}`
		profileStatus.children[1].on("click", e => {
			e.preventDefault()
			switchTo(`user`, false, `/user/${userObj.id}`)
		})
	} else {
		loggedOut()
	}
}

function loggedOut() {
	localStorage.setItem("access", "")
	profileStatus.html = "<a>Login in with Discord</a>"
	profileStatus.children[0].href = OAUTH_LINK	
}

if (localStorage.getItem("access") != null) {
	loggedIn()
} else {
	loggedOut()
}

var code = new URLSearchParams(window.location.search).get("code")
if (code != null && window.location.pathname.split("/").join("") == "home") {
	socket.emit("code", code)

	socket.on("userAccessInfo", async info => {
		localStorage.setItem("access", JSON.stringify(info))

		loggedIn()
	})
}
})();