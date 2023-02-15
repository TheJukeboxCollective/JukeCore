//// Important Global Vars

var socket = io()
var localStorage = window.localStorage

//// Utility Functions

const goto = (url, newTab = true, pageLoad = false) => {
	if (newTab) {
		window.open(url, '_blank')
	} else {
		url = url.slice(1)
		print(url)
		socket.emit("PAGE", url)
		if (url != window.location.pathname.slice(0, -1)) {
			window.scrollTo(0, 0)
			if (!pageLoad) { window.history.pushState({page: "newPage"}, "newPage", "/"+url) }
		}
	}
}

goto(window.location.pathname.slice(0, -1), false, true)

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
			goto("/"+elem.href.split("/").pop(), false) 
		}
	} 
})

var Discord = (method, path, data = null) => {
	var access_token = JSON.parse(localStorage.getItem("access")).access_token
	return socket.emitWithAck("discord", access_token, method, path, data)
}