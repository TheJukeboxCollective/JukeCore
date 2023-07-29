const { MemberDB, SongDB, BattleDB } = require("./jukedb.js")
const JukeUtils = require("./jukeutils.js")

global.Eventer = {
	_events: {},
	emit: function (event, ...args) {
		if (this._events[event]) {
			this._events[event].forEach(func => {
				func(...args)
				// print(event, ...args)
			})
		}
	},
	on: function (event, func) {
		if (!this._events[event]) {
			this._events[event] = []
		}
		this._events[event].push(func)
		// print(this._events[event])
	}
}

var interval = 1000
setInterval(() => {

//// Check if battle ended
var activeBattles = BattleDB.getUncomplete()
activeBattles.forEach(battleObj => {
	var completeTime = battleObj.endTime+((battleObj.endTime - battleObj.startTime)/2)
	var futureTime = (Date.now()+interval)
	// print(`[${battleObj.title}] ${futureTime} - ${completeTime}`)
	if (futureTime > completeTime) {
		Eventer.emit("battleEnd", battleObj)
	}
})

}, interval);


Eventer.on("battleEnd", async battleObj => {
	var songs = JukeUtils.sortPlacings(await SongDB.getBattleSongs(battleObj._id))

	var setPlace = async (author, placing) => {
		await MemberDB.add(author, placing, 1)
		// MemberDB.get(author).then(print)
	}

	var firstPlace = songs[0]
	var secondPlace = songs[1]
	var thirdPlace = songs[2]

	if (firstPlace) { firstPlace.authors.forEach(author => setPlace(author, "golds")) }
	if (secondPlace) { secondPlace.authors.forEach(author => setPlace(author, "silvers")) }
	if (thirdPlace) { thirdPlace.authors.forEach(author => setPlace(author, "bronzes")) }

	log(`Battle "${battleObj.title}" Ended!\nResults:`)
	log(songs.map((song, ind) => `(${ind+1}) ${song.authors.join(", ")} - ${song.title}: ${JukeUtils.avgVotes(song.votes)}`).join("\n"))
})