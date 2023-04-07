(async () => {
var thisUri = `http://${window.location.host}/home`

var profileStatus = new Elem("login-status")

async function loggedIn() {
	var access_token = JSON.parse(localStorage.getItem("access")).access_token
	let proms = await Promise.all([
		Discord("get", "users/@me/guilds"),
		Discord("get", "users/@me")
	])
	let guilds = proms[0]
	let userObj = proms[1]
	// print(guilds, userObj)
	guilds = (guilds != null ? guilds.map(guild=>guild.id) : null)
    if (guilds != null && guilds.includes(ENV.guild)) {
		let userObjDB = (await JukeDB.MemberDB.get(userObj.id) || {})
		profileStatus.html = `Logged in as<br><a style="color: #ffffff;">${(userObjDB.name || userObj.username)}</a>`
		profileStatus.children[1].href = `/user/${userObj.id}`
		profileStatus.children[1].on("click", e => {
			e.preventDefault()
			switchTo(`user`, false, `/user/${userObj.id}`)
		})
		localStorage.setItem("userID", userObj.id)
    } else if (guilds != null && !guilds.includes(ENV.guild)) {
    	print(`attempting "guilds/${ENV.guild}/members/${userObj.id}"...`)
    	let res = await socket.emitWithAck("joinUser", userObj.id, access_token)
    	loggedIn()
    } else {
    	loggedOut()
    }
}

function loggedOut() {
	localStorage.removeItem("access")
	profileStatus.html = "<a>Login in with Discord</a>"
	profileStatus.children[0].href = `https://discord.com/api/oauth2/authorize?client_id=1065987974296244224&redirect_uri=http%3A%2F%2Fthejuke3.ddns.net%2Fhome%2F&response_type=code&scope=guilds%20guilds.join%20identify`
}

if (localStorage.getItem("access") != null) {
	loggedIn()
} else {
	var code = new URLSearchParams(window.location.search).get("code")
	if (code != null && window.location.pathname.split("/").join("") == "home") {
		socket.emit("code", code, thisUri)

		socket.on("userAccessInfo", async info => {
			if (info != "That shit don't exist >:|") {
				localStorage.setItem("access", JSON.stringify(info))
				loggedIn()
			} else {
				loggedOut()
			}
		})
	} else {
		loggedOut()
	}
}
})();