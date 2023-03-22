const print = console.log

const path = require('path')
var request = require('sync-request')
var moment = require('moment')
const fs = require('fs-extra')
// Server //
const express = require('express')
const app = express()
const httpserver = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(httpserver, {
  maxHttpBufferSize: 100e6
});

const JukeDB = require("../jukedb.js")
const JukeUtils = require("../jukeutils.js")

const websitePath = path.resolve(__dirname, 'website')
const badgePath = path.resolve(__dirname, '../badges')

const CLIENT_ID = process.env['client']
const PC_CHANNEL = process.env['pc_chl']
const GUILD_ID = process.env['guild']

//// Page Handling ////

const PAGES = {
  "HOME": "home",
  "BATTLES": "battles*",
  "BATTLE": "battle",
  "USER": "user*",
  "NEWS": "news",
  "COLLECTIVE": "collective",
  "COMMUNITY": "community",
  "ABOUT": "home",
  "ALBUMS/PKMN-MM-2022": "pkmn-mm-2022",
}

const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}


async function parsePage(page) { // that was fucking easy 
  page = String(page.toUpperCase())
  if (Object.keys(PAGES).includes(page)) {
    // let res = request("GET", PAGES[page])
    // let pageData = res.getBody('utf-8')
    function cleanse(dirtyPath) {
      const badCritters = ["?", "*"]

      let returnPath = dirtyPath
      badCritters.forEach(critter => {
        returnPath = returnPath.split(critter).join("")
      })

      return returnPath
    }
    let pageData = String(await fs.readFile(path.join(websitePath, "pages", `${cleanse(PAGES[page])}.html`)))
    let origPageData = pageData
    var SPLIT = (pageData.includes("\r\n") ? "\r\n" : "\n")

    let pageFormat = pageData.substring(5).slice(0, (pageData.indexOf(" -->")-5))
    pageData = pageData.substring(5+pageFormat.length+4+(SPLIT.length*2))
    let pageChunks = pageData.split(`${SPLIT}${SPLIT}<!-- `)

    switch (pageFormat) {
      case "GRID":  
        // Format Grid in CSS format
        let gridArea = pageChunks.shift()
        gridArea = gridArea.split(SPLIT)
        // gridArea.pop()
        let rowCount = gridArea.length
        gridArea.join("")
        gridArea = `"${gridArea.join(`"${SPLIT}"`)}";`

        // Parsing individual elements
        var gridElements = {}

        pageChunks.forEach(chunk => {
          const DIV = ` -->${SPLIT}${SPLIT}`

          chunk = chunk.split(DIV)

          let gridDefine = chunk.shift()
          let outerHTML = chunk.join(DIV)
          let hoverText;
          let clickEvent;
          if (gridDefine.includes("||")) {
            let areaBits = gridDefine.split("||")
            gridDefine = areaBits[0]
            hoverText = areaBits[1]
            clickEvent = areaBits[2]
          }

          gridElements[gridDefine] = {html: outerHTML, hoverText: hoverText, click: clickEvent}
        })

        let returnArgs = { gridArea, gridElements, rowCount }
        return ["GRID", returnArgs]
      break;
      default:
        return ["PLAIN", origPageData]
    }
  }
}

module.exports = (client) => {
  function setupPath(urlPath) {
    app.use(urlPath, express.static(websitePath, {index: false}))
    app.use(urlPath, express.static(badgePath, {index: false}))

    app.get(urlPath, (req, res) => {
      res.sendFile('/index.html', {root: path.resolve(__dirname, "../")});
    })
  }

  Object.keys(PAGES).forEach(page => {
    let urlPath = `/${(page).toLowerCase()}`
    let pageVal = PAGES[page]

    switch (pageVal[pageVal.length-1]) {
      case '?':
        setupPath(urlPath+"/:id")
      break;
      case '*':
        setupPath(urlPath)
        setupPath(urlPath+"/:id")
      break;
      default:
        setupPath(urlPath)
    }
  })

  app.get("/", (req, res) => {
    res.redirect('/home')
  })

  io.on("connection", socket => {
    print("New Socket connected!")
    socket.on("PAGE", async page => {
      let args = await parsePage(page)
      if (args != null) {
        socket.emit("PAGE", page, ...args)
      } else {
        print("NULL PAGE, EW WTFF")
        socket.emit("NULL_PAGE", page)
      }
    })

    socket.on("code", code => {

      var data = {
        client_id: "1065987974296244224",
        client_secret: "lpvsMbew6gdy2ichuW67Or5BJXlOO19X",
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: "http://localhost:8080/home"
      }

      var bits = new URLSearchParams(Object.entries(data)).toString()

      try {
        let res = request("POST", `https://discord.com/api/v9/oauth2/token`, {
          body: bits,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        let pageData = res.getBody('utf-8')
        // print(pageData)

        socket.emit('userAccessInfo', JSON.parse(pageData))
      } catch (err) {
        if (err) {
          socket.emit('userAccessInfo', "That shit don't exist >:|")
        }
      }
    })

    socket.on('userObj', (access_token, callback) => {
      let res = request("GET", `https://discord.com/api/v9/users/@me`, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      })

      callback(JSON.parse(res.getBody("utf-8")))
    })

    const DISCORD_API = `https://discord.com/api/v9`

    socket.on("joinUser", (userId, access_token, callback) => {
      let res = request("PUT", `${DISCORD_API}/guilds/${process.env['guild']}/members/${userId}`, {
        headers: {
          Authorization: `Bot ${process.env["token"]}`
        },
        json: {
          access_token: access_token
        }
      })

      var resText;

      try {
        resText = res.getBody("utf-8")
      } catch (err) {
        resText = err  
        print(resText)
      }

      if (typeof resText == "string") {
        callback(JSON.parse(resText))
      } else {
        callback(null)
      }
    })

    socket.on("discord", (access_token, method, path, data, callback) => {
      let opts = {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }

      if (data) {
        opts["json"] = data
      }

      print(opts)

      let res = request(method.toUpperCase(), `${DISCORD_API}/${path}`, opts)

      var resText;

      try {
        resText = res.getBody("utf-8")
      } catch (err) {
        resText = err  
        print(resText)
      }

      if (typeof resText == "string") {
        callback(JSON.parse(resText))
      } else {
        callback(null)
      }
    })

    const serialize = obj => {
      var replacer = (key, value) => {
        var cache = []
        if (key == "") {
          return value
        } else {
          var valueType = typeof value
          if (valueType == "object" && value != null) {
            if (cache.includes(value)) { return "[circular]" }
            cache.push(value)
            return JSON.parse(JSON.stringify(value, replacer))
          } else {
            return value
          }
        }
      }
      var preRes = JSON.stringify(obj, replacer, "\t")
      return JSON.parse(preRes)
    }

    var bot_methods = ["user", "channel", "message", "userPageInfo", "getBadges", "getPC", "getTier", "getLikes", ["guild", process.env['guild']]]
    socket.on("jukebot", async (method, args, callback) => {
      switch (method) {
        case 'user':
          var user = await client.users.fetch(args[0])
          callback(serialize(user))
        break;
        case 'channel':
          var channel = await client.channels.fetch(args[0])
          callback(serialize(channel))
        break;
        case 'message':
          var channel = await client.channels.fetch(args[0])
          var message = await channel.messages.fetch(args[1])
          callback(serialize(message), serialize(channel))
        break;
        case "userPageInfo":
          // channel, likes, tiers, badges
          var PCForum = await client.channels.fetch(PC_CHANNEL)
          var channel = JukeUtils.getPC(args[0], PCForum)
          let res = await Promise.all([
            JukeUtils.getLikes(channel),
            PCForum.guild.members.fetch(args[0]),
          ])
          var likes = res[0]
          var member = res[1]
          callback([
            (channel ? serialize(channel) : null),
            likes,
            serialize(JukeUtils.getTier(member.roles)),
            serialize(JukeUtils.getBadges(member)),
          ])
        break;
        case "getBadges":
          var guild = await client.guilds.fetch(GUILD_ID)
          var member = await guild.members.fetch(args[0])
          callback(JukeUtils.getBadges(member))
        break;
        case "getPC":
          var PCForum = await client.channels.fetch(PC_CHANNEL)
          var channel = JukeUtils.getPC(args[0], PCForum)
          callback(serialize(channel))
        break;
        case "getTier":
          var guild = await client.guilds.fetch(GUILD_ID)
          var member = await guild.members.fetch(args[0])
          callback(serialize(JukeUtils.getTier(member.roles)))
        break;
        case 'getLikes':
          var PCForum = await client.channels.fetch(PC_CHANNEL)
          var member = await PCForum.guild.members.fetch(args[0])
          var channel = JukeUtils.getPC(member.id, PCForum)
          var likes = await JukeUtils.getLikes(channel)
          callback(likes)
        break;
      }
    })
    socket.emit("jukebot_info", bot_methods)

    socket.on("jukedb", async (DB, method, args, callback) => {
      // args.map(arg => {
      //   print(arg)
      // })
      var res = await JukeDB[DB][method](...args)
      callback(res)
    })

    var infoDBs = []
    var validMethods = {
      "MemberDB": ["validBadges"],
      "BattleDB": ["getActive"]
    }
    Object.keys(JukeDB).forEach(DB_title => {
      infoDBs.push({
        title: DB_title,
        methods: ["get", "getAll", "match", "has", "exists"].concat(validMethods[DB_title] || [])
      })
    })
    socket.emit("jukedb_info", infoDBs)

    const public_envs = ["guild", "pc_chl"]
    var thing_envs = []
    public_envs.forEach(env => {
      thing_envs.push({
        key: env,
        value: process.env[env],
      })
    })
    socket.emit("envs", thing_envs)

    var activeUploads = {}
    // uploadId = 0
    socket.on("uploadSong", async (songID, event, callback) => {
      const {SongDB} = JukeDB
      var thisUpload = activeUploads[songID]
      switch (event.type) {
        case "start":
          // print(songID, event.songTitle, event)
          var thisPath = `serverdir/${event.battleID}/${songID}`
          delete event["type"]
          var res = await Promise.all([
            SongDB.setUp(songID, event),
            fs.ensureFile(thisPath),
          ])

          var songObj = SongDB.getNow(songID)
          activeUploads[songID] = {
            thisPath: thisPath,
            startEvent: event,
            dbObj: songObj,
          }
          
          print(activeUploads[songID])
          callback(activeUploads[songID])
          // var {SongDB} = JukeDB
          // songID = JukeUtils.validID(SongDB)
          // SongDB.setUp(songID, {
          //   filename: filename,
          //   battleID: battleID
          // })
          // var bits = filename.split(".")
          // activeUploads[songID] = {
          //   ext: bits[bits.length-1]
          // }
        break;
        case "data":
          var {thisPath} = activeUploads[songID]
          await fs.appendFile(thisPath, event.data)
          callback()
        break;
        case "done":
          var {thisPath} = activeUploads[songID]
          var correctExt = true
          var ext = ""

          var {fileTypeFromFile} = await import("file-type")
          var fileType = await fileTypeFromFile(thisPath)
          var ext = `.${fileType.ext}`

          await fs.rename(thisPath, `${thisPath}${ext}`)
          /// Check file extention logic here...

          callback(correctExt)
        break;
      }
    })

    socket.on("genSongID", async (callback) => {
      let songID = await JukeUtils.validID(JukeDB["SongDB"])
      callback(songID)
    })
  })

  app.use(function(req, res, next) {
    res.status(404)
    res.sendFile('/error.html', {root: websitePath});
  })

  //////////////////////////

  httpserver.listen(8080, "0.0.0.0", (e) => {
    print("Server Listening!")
  })
}