const print = console.log

const JUKE_EMOJI = process.env['emoji_j']
const BOX_EMOJI = process.env['emoji_b']

const JUKER_ROLE = process.env['juker_role']
const SUPER_JUKER_ROLE = process.env['super_juker_role']
const BOXEE_ROLE = process.env['boxee_role']
const JUKEBOXER_ROLE = process.env['jukeboxer_role']
const ARCHJUKER_ROLE = process.env['archjuker_role']

const LIKE_EMOTE = process.env['emoji_l']

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

module.exports = {
	coinToEmote: (str) => {
		return {jukes: JUKE_EMOJI, boxes: BOX_EMOJI}[str.toLowerCase()]
	},
	validID: async (DataBase) => {
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
					print(retID)
					res(retID)
				}
			}
			check()
		})
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
      var message = await channel.messages.fetch(channel.id)
      var reactions = message.reactions.cache
      // print(reactions)
      var reaction = reactions.find(react => {
        return (`<:${react.emoji.name}:${react.emoji.id}>` == LIKE_EMOTE)
      })
      return (reaction ? reaction.count : 0)
	},
}