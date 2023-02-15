const print = console.log

require('dotenv').config({ path: `${__dirname}/.env` })
const path = require('path')
var request = require('sync-request')
const fs = require('fs-extra')
// Server //
const express = require('express')
const app = express()
const httpserver = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(httpserver, {
  maxHttpBufferSize: 100e6
});

const { MemberDB, ChannelDB } = require("../jukedb.js")

//// Page Handling ////

const PAGES = {
  "HOME": "home",
  "SUBMIT": "submit",
  "NEWS": "news",
  "COLLECTIVE": "collective",
  "COMMUNITY": "community",
  "ABOUT": "home",
  "ALBUMS/PKMN-MM-2022": "pkmn-mm-2022",
}

async function parsePage(page) { // that was fucking easy 
  page = String(page.toUpperCase())
  if (Object.keys(PAGES).includes(page)) {
    // let res = request("GET", PAGES[page])
    // let pageData = res.getBody('utf-8')
    let pageData = String(await fs.readFile(path.join("site/website", "pages", `${PAGES[page]}.html`)))
    let origPageData = pageData
    var SPLIT = (pageData.includes("\r\n") ? "\r\n" : "\n")

    let pageFormat = pageData.substring(5).slice(0, (pageData.indexOf(" -->")-5))
    pageData = pageData.substring(5+pageFormat.length+8)
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
  Object.keys(PAGES).forEach(page => {
    let urlPath = `/${(page).toLowerCase()}`
    app.use(urlPath, express.static(path.join(__dirname, 'website'), {index: false}))

    app.get(urlPath, (req, res) => {
      res.sendFile('/index.html', {root: path.join(__dirname, 'website')});
    })
  })

  app.get("/", (req, res) => {
    res.redirect('/home')
  })

  io.on("connection", socket => {
    print("New Socket connected!")
    socket.on("PAGE", async page => {
      let args = await parsePage(page)
      socket.emit("PAGE", ...args)
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
      callback(JSON.parse(res.getBody("utf-8")))
    })

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
    res.sendFile('/error.html', {root: path.join(__dirname, 'website')});
  })

  /////////////////////////

  httpserver.listen(8080, "0.0.0.0", (e) => {
    print("Server Listening!")
  })
}