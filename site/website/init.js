//// Important Global Vars

var socket = io()
var localStorage = window.localStorage

var newPageFuncs = []

//// Utility Functions

const goto = (url, newTab = true, pageLoad = false) => {
	if (newTab) {
		window.open(url, '_blank')
	} else {
		if (url.startsWith("/")) { url = url.slice(1) }
		print(url)
		socket.emit("PAGE", url)
		if (url != window.location.pathname.slice(0, -1)) {
			window.scrollTo(0, 0)
			if (!pageLoad) { window.history.pushState({page: "newPage"}, "newPage", "/"+url) }
			newPageFuncs.forEach(func => { func() })
			var pageName = window.location.pathname.split("/")[1]
			pageName = (pageName[0].toUpperCase()) + (pageName.slice(1).toLowerCase())
			document.title = `[${pageName}] ••• <Jukebox Music>`
		}
	}
}

function onNewPage(func) {
	newPageFuncs.push(func)
}

function wait(time) {
	return new Promise((res, rej) => {
		setTimeout(() => {
			res()
		}, time)
	})
}

function randi(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

//// Anchor Elements do the thing

Object.defineProperty(Elem.prototype, "href", {
	set(val) {
		this._href = val
		this.elem.setAttribute("href", val)
		this.elem.onclick = e => {
			let elemURL = new URL(this.elem.href)
			print(elemURL.host == window.location.host)
			if (elemURL.host == window.location.host) {
				e.preventDefault()
				goto("/"+this.elem.href.split("/").pop(), false) 
			}
		}
	},

	get() {
		return this._href
	}
})

Array.from(document.querySelectorAll('a')).forEach(elem => {
	elem.onclick = e => {
		let elemURL = new URL(elem.href)
		print(elemURL.host == window.location.host)
		if (elemURL.host == window.location.host) {
			e.preventDefault()
			goto(elem.href.split("/").pop(), false) 
		}
	} 
})

var Discord = (method, path, data = null) => {
	var access_token = JSON.parse(localStorage.getItem("access")).access_token
	return socket.emitWithAck("discord", access_token, method, path, data)
}

var JukeDB = {}

socket.on("jukedb_info", DBs => {
	DBs.forEach(DB => {
		JukeDB[DB.title] = {}
		DB.methods.forEach(method => {
			JukeDB[DB.title][method] = async (...args) => {
				return socket.emitWithAck("jukedb", DB.title, method, [...args])
			}
		})
	})
})

print(JukeDB)