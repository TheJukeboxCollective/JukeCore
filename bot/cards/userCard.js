const print = console.log

//// Env
const GUILD_ID = process.env['guild']
const PC_CHANNEL = process.env['pc_chl']

const JUKER_ROLE = process.env['juker_role']
const SUPER_JUKER_ROLE = process.env['super_juker_role']
const BOXEE_ROLE = process.env['boxee_role']
const JUKEBOXER_ROLE = process.env['jukeboxer_role']
const ARCHJUKER_ROLE = process.env['archjuker_role']

//// Requires
const path = require('path')
const { createCanvas, registerFont, loadImage } = require('canvas')
const { MemberDB, ChannelDB } = require("../../jukedb.js")
const JukeUtils = require("../../jukeutils.js")

const BADGES = require("../../badges.json")

const DIR = './bot/cards/'
const DF = 'fonts/'
const DA = 'assets/'

//// Fonts
registerFont(DIR+DF+'AtkinsonHyperlegible-Bold.ttf', { family: 'Big Card' })
registerFont(DIR+DF+'Comfortaa-Bold.ttf', { family: 'Mid Card' })

const canvas = createCanvas(1324, 827)
const ctx = canvas.getContext('2d')

Math.rad = (degrees) => {
  var pi = Math.PI;
  return degrees * (pi/180);
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

const GRID = {
  x: 574,
  y: 230,
  w: 2,
  h: 5,
  margin: {
    x: 11, // left
    y: 13 // top
  },
  badge_space: {
    x: 37,
    y: 6
  }
}
const BADGE_SIZE = {
  w: 340,
  h: 84
}

function calcCellPos(ind) {
  let row = Math.floor(ind/GRID.w)
  let column = ind - (row*GRID.w)
  
  return {
    x: ((column*(BADGE_SIZE.w+GRID.badge_space.x)) + GRID.margin.x) + GRID.x,
    y: ((row*(BADGE_SIZE.h+GRID.badge_space.y)) + GRID.margin.y) + GRID.y
  }
}

const countText = (amount, x, y) => {
	ctx.font = `36px "Mid Card"`
	ctx.textBaseline = "middle"
	thisText = ("x" + amount)
	ctx.lineWidth = 12
	ctx.strokeStyle = "#151515"
	ctx.strokeText(thisText, x, y)
	ctx.fillStyle = "white"
	ctx.fillText(thisText, x, y)
}

async function make(client, userId) {
	var guildObj = await client.guilds.fetch(GUILD_ID)

	var proms = await Promise.all([
		guildObj.members.fetch(userId),
		MemberDB.get(userId),
		client.channels.fetch(PC_CHANNEL)
	])

	var memberObj = proms[0]
	var userObjDB = proms[1]
	var PChannel = (proms[2].threads.cache.find(thread => thread.ownerId == memberObj.id ))	

	var COLOR = "#7E2AD1"

	//// Background Box
	ctx.fillStyle = COLOR
	ctx.beginPath()
	ctx.roundRect(58, 160, 1266, 667, 25)
	ctx.fill()

	// Template
	let templateImg = await loadImage(DIR+DA+"template.png")
	ctx.drawImage(templateImg, 0, 0)

	// Draw icon --- \/ \/ \/
	let memberIconURL = (memberObj.displayAvatarURL().replace("webp", "png") + "?size=300")
	let memberIconImg = await loadImage(memberIconURL)

	ctx.save()
	ctx.rotate(Math.rad(-6.72))
	ctx.beginPath()
	ctx.roundRect(0, 44.77, 382.38, 382.38, 48)
	ctx.fillStyle = "#151515"
	ctx.fill()
	ctx.clip()
	ctx.drawImage(memberIconImg, 0, 44.77, 382.38, 382.38)

	ctx.restore()

	ctx.strokeStyle = "#151515"
	ctx.lineWidth = 15
	ctx.stroke()

	let thisText;
	let thisMaxWidth;
	let thisWidth;

	// Name
	ctx.resetTransform()
	ctx.font = `76px "Big Card"`
	ctx.textBaseline = "middle"
	thisText = memberObj.displayName
	thisMaxWidth = 478
	thisWidth = ctx.measureText(thisText).width
	ctx.fillStyle = "white"
	ctx.fillText(thisText, 81, (417+74), thisMaxWidth)

	// Balance
	ctx.font = `36px "Mid Card"` // Jukes 
	ctx.textBaseline = "middle"
	thisText = userObjDB.jukes.toLocaleString("en-US")
	thisMaxWidth = 153.22
	thisWidth = ctx.measureText(thisText).width
	ctx.fillStyle = "white"
	ctx.fillText(thisText, 144.37+((thisMaxWidth/2)-(thisWidth/2)), (562.67+(49.88/2)) )

	ctx.font = `36px "Mid Card"` // Boxes
	ctx.textBaseline = "middle"
	thisText = userObjDB.boxes.toLocaleString("en-US")
	thisMaxWidth = 153.22
	thisWidth = ctx.measureText(thisText).width
	ctx.fillStyle = "white"
	ctx.fillText(thisText, 388.12+((thisMaxWidth/2)-(thisWidth/2)), (562.67+(49.88/2)) )

	// Placings
	countText(userObjDB.golds, 128, 767) // 1st
	countText(userObjDB.silvers, 275, 767) // 2nd
	countText(userObjDB.bronzes, 426, 767) // 3rd
	
	// Personal Channel
	if (PChannel) {
		ctx.font = `40px "Big Card"`
		ctx.textBaseline = "middle"
		thisText = (PChannel.name)
		ctx.fillStyle = "white"
		ctx.fillText(thisText, 655, 749)

		let LikeIconImg = await loadImage(DIR+DA+"likeIcon.png")
		ctx.drawImage(LikeIconImg, 1202, 704, 76, 76)

		let likes = await JukeUtils.getLikes(PChannel)
		countText(likes, 1240, 763)
	} else {
		ctx.font = `40px "Big Card"`
		ctx.textBaseline = "middle"
		thisText = "No Personal Channel..."
		ctx.fillStyle = "#818181"
		ctx.fillText(thisText, 655, 749)
	}

	let badgeProms = []
	// let badges = [
	// 	"DEV", "PKMN M&M 2022",
	// 	"PKMN M&M 2022", "DEV",
	// 	"DEV", "PKMN M&M 2022",
	// 	"PKMN M&M 2022", "DEV",
	// 	"PKMN M&M 2022", "DEV",
	// ]
	// let badges = await MemberDB.validBadges(userObjDB)
	let badges = []
	let thisRoles = Array.from(memberObj.roles.cache.keys())
	Object.keys(BADGES).forEach(key => {
		let badge = BADGES[key]
		if (thisRoles.includes(badge.role)) {
			badges.push(badge.name)
		}
	})
	print(badges)
	if (badges.length > 0) {
		badges.forEach((badge, i) => {
			var thisFunc = async () => {
				let badgeImg = await loadImage(path.resolve(__dirname, `../../badges/${badge}.png`))
				let badgePos = calcCellPos(i)
				ctx.drawImage(badgeImg, badgePos.x, badgePos.y)
				return true
			}
			badgeProms.push(thisFunc())
		})
		await Promise.all(badgeProms)
	} else {
		ctx.font = `64px "Big Card"`
		ctx.textBaseline = "middle"
		thisText = "No Badges..."
		thisMaxWidth = 432
		thisWidth = ctx.measureText(thisText).width
		ctx.fillStyle = "#202020"
		ctx.fillText(thisText, 727+((thisMaxWidth/2)-(thisWidth/2)), (395+(98/2)) )
	}

	// Tier Emblem
	let thisTier = JukeUtils.getTier(memberObj.roles).ind
	if (thisTier > 0) {
		let tierEmblem = await loadImage(DIR+DA+`emblem${thisTier}.png`)
		ctx.drawImage(tierEmblem, 331, 277, 141, 141)
	}

	ctx.quality = "best"

	var buf = await canvas.toBuffer('image/png', { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE })
	print(thisText)

	return buf
}

module.exports = (async (...args) => {return await make(...args)})