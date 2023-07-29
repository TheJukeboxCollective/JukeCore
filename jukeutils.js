const path = require('path')

const BADGES = require("./badges.json")

const JUKE_EMOJI = process.env['emoji_j']
const BOX_EMOJI = process.env['emoji_b']

const JUKER_ROLE = process.env['juker_role']
const SUPER_JUKER_ROLE = process.env['super_juker_role']
const BOXEE_ROLE = process.env['boxee_role']
const JUKEBOXER_ROLE = process.env['jukeboxer_role']
const ARCHJUKER_ROLE = process.env['archjuker_role']

const LIKE_EMOTE = process.env['emoji_l']

const JukeDB = require("./jukedb.js")

function randi(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function wait(time) {
	return new Promise((res, rej) => {
		setTimeout(() => {
			res()
		}, time)
	})
}

const JukeUtils = {
	coinToEmote: (str) => {
		return {jukes: JUKE_EMOJI, boxes: BOX_EMOJI}[str.toLowerCase()]
	},
	validID: async (DataBase) => {
		if (typeof DataBase == "string") { DataBase = JukeDB[DataBase] }
		if (DataBase) {
			return new Promise((res, rej) => {
				function genID() {
					return Array(18).fill(0).map(num => randi(0, 9)).join("")
				}

				var retID;
				async function check() {
					retID = genID()
					if (await DataBase.exists(retID)) {
						await wait(1)
						check()
					} else {
						res(retID)
					}
				}
				check()
			})
		} else {
			return null
		}
	},
	getBadges: member => {
		let badges = []
		let thisRoles = Array.from(member.roles.cache.keys())

		Object.keys(BADGES).forEach(key => {
			let badge = BADGES[key]
			if (thisRoles.includes(badge.role)) {
				badges.push(badge.name)
			}
		})

		return badges
	},
	getTier: (roles) => {
        const TIER_ROLES = [
            ARCHJUKER_ROLE,     // 5 - 1 == 4
            JUKEBOXER_ROLE,     // 5 - 2 == 3
            BOXEE_ROLE,         // 5 - 3 == 2
            SUPER_JUKER_ROLE,   // 5 - 4 == 1
            JUKER_ROLE,         // 5 - 5 == 0
        ]

        var toReturn = 0;

        for (let ind = 0; ind < TIER_ROLES.length; ind++) {
            let roleId = TIER_ROLES[ind]
            if (roles.cache.has(roleId)) {
            	toReturn = {ind: (TIER_ROLES.length-(ind+1)), role: roleId}
                break;
            }
        }

        return toReturn
	},
	getLikes: async (channel) => {
			if (channel) {
	      var message = await channel.messages.fetch(channel.id)
	      var reactions = message.reactions.cache
	      // print(reactions)
	      var reaction = reactions.find(react => {
	        return (`<:${react.emoji.name}:${react.emoji.id}>` == LIKE_EMOTE)
	      })
	      return (reaction ? reaction.count : 0)
			} else {
				return 0
			}
	},
	getPC: (userId, PCForum) => {
		return (PCForum.threads.cache.find(thread => thread.ownerId == userId ))
	},
	calcVoteTime: (start, end) => {
		const DIV = 2

		return (end+((end-start)/DIV))
	},
	avgVotes: (votes) => {
		var total = 0
		var values = Object.values(votes)
		values.forEach(value => {
			total += value
		})

		return (total/values.length)
	},
	sortPlacings: (songs) => {
		songs.sort((a, b) => {
			var aVotesAvg = JukeUtils.avgVotes(a.votes)
			var bVotesAvg = JukeUtils.avgVotes(b.votes)

			return (bVotesAvg - aVotesAvg)
		})

		return songs
	},
	songPath: async (song) => {
		var serverPath = process.env["serverdir"]
		const { readdir } = require('node:fs/promises')
	    var files = await readdir(path.join(serverPath, song.battleID))

	    // Extension
	    var ext;
	    for (let i = 0; i < files.length; i++) {
	      var file = files[i]
	      if (file.startsWith(song._id)) {
	        var namebits = file.split(".")
	        ext = namebits[namebits.length-1]
	        break
	      }
	    }

	    return path.join(serverPath, song.battleID, `${song._id}.${ext}`)
	},
	fancy_title: async (song) => {
		print(song.authors)
		var proms = song.authors.map(author => JukeBotClient.users.fetch(author))
		var res = await Promise.all(proms)

		var authorNames = res.map(author => author.username).join(", ")
		return (`${authorNames} - ${song.title}`)
	}
}

module.exports = JukeUtils