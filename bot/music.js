
const { spawn } = require('node:child_process')

global.Music = {}

Music._sub_process = spawn("node", ["bot/play.js"], { stdio: ['ipc', process.stdout, process.stderr] })
setTimeout(() => {
	Music._sub_process.send({type: "init"})
}, 1000)

var sendCommand = Music._sub_process.send.bind(Music._sub_process)

async function awaitMessage(msg) {
	sendCommand(msg)
	return new Promise((res, rej) => {
		Music._sub_process.on("message", msg => {
			if (msg.type) { res(msg.returnData) }
		})
	})
}

Music._sub_process.on("message", async msg => {
	switch (msg.type) {
		case "init":
			// print(msg)
			msg.keys.forEach(key => {
				Object.defineProperty(Music, key, {
					get() {
						return awaitMessage({ type: "key", key: key })
					},
					set(value) {
						awaitMessage({ type: "setKey", value: value })
					}
				})
			})
			msg.methods.forEach((method, ...args) => {
				Music[method] = async (...args) => {
					return awaitMessage({ type: "method", method: method, args: args })
				}
			})
		break;
	}
})