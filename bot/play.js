global.DEBUG = (process.env["debug"] == "true")
global.print = (...args) => {
	if (DEBUG) { console.log(...args) }
}
global.log = console.log

require("../arrayLib.js")
const fs = require('node:fs')
const token = process.env['token']
const { Client, IntentsBitField, Partials } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags), partials: Object.values(Partials) })
global.JukeBotClient = client

const JukeUtils = require("../jukeutils.js")

const { VoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, demuxProbe, StreamType } = require('@discordjs/voice')
const Discord = require('discord.js')

const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

async function probeAndCreateResource(readableStream) {
	const { stream, type } = await demuxProbe(readableStream)
	let rec =  createAudioResource(readableStream, { inputType: type, inlineVolume: true });
	rec.volume.setVolume(0.5)
	return rec
}

Discord.VoiceChannel.prototype.join = function () {
	var c = joinVoiceChannel({
		channelId: this.id,
		guildId: this.guild.id,
		adapterCreator: this.guild.voiceAdapterCreator,
	})
	var player = createAudioPlayer()
	c.subscribe(player)
	c.juke_player = player
	return c
}

VoiceConnection.prototype.play = async function (res) {
	if (this.juke_player == null) { print("player not found!!"); return }
	this.juke_player.play(await probeAndCreateResource(res))
}

global.Music = {
	queue: [],
	VC: null,
	VCText: null,
	VCID: null,
	VConnection: null,
	intResolution: 250,
	progress: 0,
	init: async (VCID, VCTextID) => {
		Music.VCID = VCID
		Music.VCText = await JukeBotClient.channels.fetch(VCTextID)
	},
	add_queue: async function (song, channelID = Music.VCID) {
		if (!Music.active) {
			await Music.joinVC(channelID)
			await Music.play(song)
		}

		var index = Music.queue.length
		Music.queue.push(song)
		return index
	},
	async joinVC(channelID = Music.VCID) {
		Music.VC = await JukeBotClient.channels.fetch(channelID)
		Music.VConnection = Music.VC.join()
	},
	async play(song) {
		var songPath = await JukeUtils.songPath(song)

		const promise = new Promise((res, rej) => {
			require('ffprobe')(songPath, { path: require('ffprobe-static').path }, function (err, info) {
				if (err) return print_error(err);
				res(Number(info.streams[0].duration)*1000)
			})
		})
		var songDuration = await promise

		var stream = fs.createReadStream(songPath)
		Music.VConnection.play(stream)
		var userAuthors = []
		await song.authors.awaitForEach(async author => {
			var userAuthor = await JukeBotClient.users.fetch(author)
			userAuthors.push(userAuthor.username)
		})
		if (Music.VCText) {Music.VCText.send(`Now Playing: **${userAuthors.join(", ")} - ${song.title}**`)}
		// setTimeout(Music.check, songDuration+1000)

		var int = setInterval(() => {
			if (Music.progress >= songDuration) {
				clearInterval(int)
				setTimeout(Music.check, 1000)
			} else {
				Music.progress += Music.intResolution
			}
		}, Music.intResolution)
	},
	async check() {
		print("Hello?")
		Music.progress = 0
		var previous = Music.queue.shift()
		var playNext = Music.queue[0]
		if (playNext) {
			await Music.play(playNext)
		} else {
			if (Music.VCText) { Music.VCText.send(`**Queue finished...**`) }
		}
	},
	get active () {
		return (Music.queue.length > 0)
	},
	get now_playing () {
		return (Music.active ? Music.queue[0] : null)
	}
}

print("Logging in???")
client.login(token)

client.on("ready", async () => {
	print("Play.js logged in!")
})

process.on("message", async msg => {
	switch (msg.type) {
		case 'init':
			var methods = getMethods(Music)
			var keys = Object.keys(Music).filter(key => !methods.includes(key))
			process.send({
				type: "init",
				keys: keys,
				methods: methods
			})
		break;
		case "key":
			process.send({
				type: "key",
				returnData: Music[msg.key]
			})
		break;
		case "setKey":
			print(`New Value: ${msg.value}`)
			Music[msg.key] = msg.value
		break;
		case "method":
			var res = await Music[msg.method](...msg.args)
			process.send({
				type: "method",
				returnData: res
			})
		break;
	}
})