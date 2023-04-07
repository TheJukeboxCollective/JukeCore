(async () => {
const print_debug = print

var thisUri = `http://${window.location.host}/home/`

var profileStatus = new Elem("login-status")

async function loggedIn() {
	print_debug("Logging In...")
	var access_token = JSON.parse(localStorage.getItem("access")).access_token
	print_debug("Stored Access Token: ", access_token)
	let proms = await Promise.all([
		Discord("get", "users/@me/guilds"),
		Discord("get", "users/@me")
	])
	let guilds = proms[0]
	let userObj = proms[1]
	print_debug(guilds, userObj)
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
    	print_debug("wamp wamp")
    	loggedOut()
    }
}

function loggedOut() {
	print_debug("Logging Out...")
	localStorage.removeItem("access")
	profileStatus.html = "<a>Login in with Discord</a>"
	profileStatus.children[0].href = `https://discord.com/api/oauth2/authorize?client_id=${ENV["client"]}&redirect_uri=${encodeURIComponent(thisUri)}&response_type=code&scope=guilds%20guilds.join%20identify`
}

if (localStorage.getItem("access") != null) {
	loggedIn()
} else {
	var code = new URLSearchParams(window.location.search).get("code")
	print_debug("Authing: ", code, window.location.pathname.split("/").join(""))
	if (code != null && window.location.pathname.split("/").join("") == "home") {
		socket.emit("code", code, thisUri)
		print_debug("emitting code for auth")

		socket.on("userAccessInfo", async info => {
			print_debug("userinfo got: ", info)
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