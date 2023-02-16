const print = console.log

const JUKE_EMOJI = process.env['emoji_j']
const BOX_EMOJI = process.env['emoji_b']

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
}