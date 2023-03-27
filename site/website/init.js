//// Important Global Vars

var socket = io()
var localStorage = window.localStorage

var currPage;
var newPageFuncs = []

//// Utility Functions


const TO = (url, pageLoad, realUrl = url) => {
	// print(url)
	if (currPage != url) {
		socket.emit("PAGE", url)
		if (url != window.location.pathname.slice(0, -1)) {
			window.scrollTo(0, 0)
			if (!pageLoad) { window.history.pushState({page: "newPage"}, "newPage", "/"+realUrl) }
			newPageFuncs.forEach(func => { func() })
			var pageName = window.location.pathname.split("/")[1]
			pageName = (pageName[0].toUpperCase()) + (pageName.slice(1).toLowerCase())
			document.title = `${pageName} 🎶 <JukeBox>`
			// print(document.title)
		}
	}
}

const goto = (url, newTab = true, pageLoad = false) => {
	if (newTab) {
		window.open(url, '_blank')
	} else {
		if (url.startsWith("/")) { url = url.slice(1) }
		TO(url, pageLoad)
	}
}

const switchTo = (url, pageLoad = false, realUrl = window.location.pathname) => {
	if (url.startsWith("/")) { url = url.slice(1) }
	if (realUrl.startsWith("/")) { realUrl = realUrl.slice(1) }
	TO(url, pageLoad, realUrl)
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

function occurrences(string, subString, allowOverlapping = false) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function measureText(text) {
    var canvas = new Elem("canvas")
    var ctx = canvas.elem.getContext("2d")
    ctx.style = "font-family: Big Card;"

    return ctx.measureText(text)
}

Array.prototype.last = function () {
	return this[this.length-1]
}

Array.prototype.asyncForEach = async function(func) {
	var proms = []

	this.forEach((...args) => {
		proms.push(func(...args))
	})

	return await Promise.all(proms)
}

//// Anchor Elements do the thing

function THEANCHORFUNC(e) {
	var elem = e.target
	e.preventDefault()
	let elemURL = new URL(elem.href)
	print(elemURL.host == window.location.host)
	if (elemURL.host == window.location.host) {
		var dest = elem.href.split(window.location.host)[1]
		let ind = 0
		if (dest.startsWith("/")) {ind = 1}
		var page = dest.split("/")[ind]
		if (Object.keys(SHORTENS).includes(page) && (occurrences(dest, "/") - ind) > 0) { page = SHORTENS[page] }
		switchTo(page, false, dest)
	}
}

Object.defineProperty(Elem.prototype, "href", {
	set(val) {
		this._href = val
		this.elem.setAttribute("href", val)
		this.elem.onclick = THEANCHORFUNC
	},

	get() {
		return this._href
	}
})

const SHORTENS = {
	battles: "battle",
	users: "user"
}

function updateAnchors() {
	Array.from(document.querySelectorAll('a')).forEach(elem => {
		elem.onclick = THEANCHORFUNC
	})
}
updateAnchors()

var Discord = (method, path, data = null) => {
	var access_token = JSON.parse(localStorage.getItem("access")).access_token
	return socket.emitWithAck("discord", access_token, method, path, data)
}
	
var JukeBot = {}
socket.on("jukebot_info", methods => {
	methods.forEach(method => {
		if (!Array.isArray(method)) {
			JukeBot[method] = (...args) => {
				return socket.emitWithAck("jukebot", method, [...args])
			}
		} else { // properties
			JukeBot[method[0]] = method[1]
		}
	})	
})

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

var ENV = {}

socket.on("envs", envs => {
	envs.forEach(env => {
		ENV[env.key] = env.value
	})
})

new Array("collective", "community").forEach(type => {
	// print(type)
	var dropDown = new Elem(document.querySelector(`.drop-down[${type}]`))

	dropDown.style.setProperty("--drop-down-height", `${dropDown.height}px`)

	new ResizeObserver(() => {
		dropDown.style.setProperty("--drop-down-height", `${dropDown.height}px`)
	}).observe(dropDown.elem)
})

var eventListeners = {}
function eventListen(event, func) {
	if (Array.isArray(eventListeners[event])) {
		eventListeners[event].push(func)
	} else {
		eventListeners[event] = [func]
	}
}

function eventFire(event) {
	if (Array.isArray(eventListeners[event])) {
		eventListeners[event].forEach(func => {
			func()
		})
	}
}

window.onpopstate = e => { newPop() }


function downloadFile(url, fileName){
  fetch(url, { method: 'get', mode: 'no-cors', referrerPolicy: 'no-referrer' })
    .then(res => res.blob())
    .then(res => {
      const aElement = document.createElement('a');
      aElement.setAttribute('download', fileName);
      const href = URL.createObjectURL(res);
      aElement.href = href;
      // aElement.setAttribute('href', href);
      aElement.setAttribute('target', '_blank');
      aElement.click();
      URL.revokeObjectURL(href);
    });
}