const print = console.log

require('dotenv').config({ path: `${__dirname}/.sec` })
require('dotenv').config({ path: `${__dirname}/.env` })
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

const websitePath = path.resolve(__dirname, 'website')
const badgePath = path.resolve(__dirname, '../badges')

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

      let res = request("POST", `https://discord.com/api/v9/oauth2/token`, {
        body: bits,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      let pageData = res.getBody('utf-8')
      print(pageData)

      socket.emit('userAccessInfo', JSON.parse(pageData))
    })

    socket.on('userObj', (access_token, callback) => {
      let res = request("GET", `https://discord.com/api/v9/users/@me`, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      })

      callback(JSON.parse(res.getBody("utf-8")))
    })

    socket.on("discord", (access_token, method, path, data, callback) => {
      let res = request(method.toUpperCase(), `https://discord.com/api/v9/${path}`, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      })

      var resText;

      try {
        resText = res.getBody("utf-8")
      } catch (err) {
        resText = err  
      }

      if (typeof resText == "string") {
        callback(JSON.parse(resText))
      } else {
        callback(null)
      }
    })

    var bot_methods = ["user", "channel", ["guild", process.env['guild']]]
    socket.on("jukebot", async (method, args, callback) => {
      switch (method) {
        case 'user':
          let user = await client.users.fetch(args[0])
          callback(user)
        break;
        case 'channel':
          let channel = await client.channels.fetch(args[0])
          callback(channel)
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

    socket.on("upload", async (folder, filename, event, callback) => {
      var thisPath = `serverdir/${folder}/${filename}` 
      switch (event.type) {
        case "start":
          var exists = await fs.pathExists(thisPath)
          if (exists) {
            await fs.remove(thisPath)
          }
        break;
        case "data":
          await fs.appendFile(thisPath, event.data)
        break;
        case "done":
          print("Upload complete.")
        break;
      }

      callback()
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