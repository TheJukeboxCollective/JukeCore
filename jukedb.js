const print = console.log
const gsheetdb = require('./gsheetdb.js')
const SHEET_ID = process.env['sheet']
const SCRIPT_ID = process.env['script']

function getAllFuncs(toCheck) {
    const props = [];
    let obj = toCheck;
    do {
        props.push(...Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));
    
    return props.sort().filter((e, i, arr) => { 
       if (e!=arr[i+1] && typeof toCheck[e] == 'function') return true;
    });
}

const schemas = {
    members: [
        {type: "String", default: null}, // user_id
        {type: "String", default: null}, // name
        {type: "Number", default: 0}, // jukes
        {type: "Number", default: 0}, // boxes
        {type: "Number", default: 0}, // golds
        {type: "Number", default: 0}, // silvers
        {type: "Number", default: 0}, // bronzes
    ],
    channels: [
        {type: "String", default: null}, // channel_id
        {type: "String", default: null}, // owner
        {type: "Array", default: []}, // admins
        {type: "Array", default: []}, // managers
    ],
    battles: [
        {type: "String", default: null}, // battle_id
        {type: "String", default: null}, // host_id
        {type: "String", default: null}, // title
        {type: "String", default: null}, // desc
        {type: "Date", default: "NOW"}, // startTime
        {type: "Date", default: null}, // endTime
    ],
    songs: [
        {type: "String", default: null}, // song_id
        {type: "String", default: null}, // battle_id
        {type: "String", default: null}, // title
        {type: "Array", default: []}, // authors
        {type: "Date", default: "NOW"}, // uploadDate
        {type: "String", default: null}, // filename
        {type: "Number", default: 0}, // length
    ]
}

function wait(ms) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res()
        }, ms)
    })
}

function clone(obj) {
    return Object.assign({}, obj)
}

const escapedChars = ["{", "}", "[", "]"]

// function getType(value) {
//     if (value == null) {
//         return "null"
//     } else if (Array.isArray(value)) {
//         return "Array"
//     } else if (typeof value == "string") {
//         return "String"
//     }
// }

function escape(name, ind, value) {
    // var valueType = getType(value)
    var valueType = (value == null ? "null" : schemas[name][ind].type)
    switch (valueType) {
        case "null":
            return "{null}"
        break;
        case "Array":
            return JSON.stringify(value)
        break;
        case "String":
            let newStr = value
            escapedChars.forEach(char => {
                newStr = newStr.replaceAll(char, "/"+char)
            })
            return newStr
        break;
        case "Badges":
            let retArr = []
            Object.values(value).forEach(i => {
                retArr.push(i == true ? 1 : 0)
            })
            return JSON.stringify(retArr)
        break;
        case "Boolean":
            return value
        break;
        case "Date":
            if (value == "NOW") {
                return Date.now()
            } else {
                return value
            }
        break;
        default:
            return value
    }
}

function unescape(name, ind, value) {
    var valueType = schemas[name][ind].type
    if (value == "{null}") {
        return null
    } else {
        switch (valueType) {
            case "Array":
                return JSON.parse(value)
            break;
            case "Number":
                return value
            break;
            case "String":
                let newStr = value
                escapedChars.forEach(char => {
                    newStr = newStr.replaceAll("/"+char, char)
                })
                return newStr
            break;
            case "Badges":
                let retObj = {}
                let thisArr = JSON.parse(value)
                let keys = Object.values(require("./badges.json"))

                keys.forEach((key, i) => {
                    retObj[key] = (thisArr[i] == 1 ? true : false)
                })

                return retObj
            break;
            case "Boolean":
                return value
            break;
            default:
                return value
        }
    }
}

var formatData = (name, data) => {
    // print(data)
    let returnObj = {}
    let headers = []
    data.forEach((row, ind) => {
        if (ind == 0) {
            headers = row.values
            returnObj._rowIndex = {}
            headers.forEach((header, h_ind) => {
                if (h_ind == 0) return;
                returnObj._rowIndex[header] = h_ind
            })
        } else {
            let this_key = ""
            row.values.forEach((value, v_ind) => {
                if (v_ind == 0) {
                    this_key = value
                    returnObj[this_key] = {
                        _index: row.rowNb,
                        returnData: {},
                        _rowData: row.values
                    }
                } else {
                    returnObj[this_key].returnData[headers[v_ind]] = unescape(name, v_ind, value)
                }
            })
        }
    })
    return returnObj
}

class Sheet {
    constructor(name) {
        this.inited = false
        this._name = name
        this._sheet = new gsheetdb({
            spreadsheetId: SHEET_ID,
            scriptId: SCRIPT_ID,
            sheetName: name,
            credentialsJSON: require('./credentials.json')
        })
        this._updateData().then(() => {
            this.inited = true
            this._call("init")
        })
        this._events = []
    }

    async _updateData() {
        let data = await this._sheet.getData()
        this._data = formatData(this._name, data)
    }

    default() {
        let thisObj = {}
        let thisSchema = schemas[this._name]
        let properties = Object.keys(this._data._rowIndex)
        properties.forEach((key, ind) => {
            thisObj[key] = thisSchema[ind+1].default
        })
        print(thisObj)
        return thisObj
    }

    async get(id) {
        await this._updateData()
        let idObj = this._data[id]
        if (idObj != null) {
            return idObj.returnData
        } else {
            return null
        }
    }

    getNow(id) {
        // await this._updateData()
        let idObj = this._data[id]
        if (idObj != null) {
            return idObj.returnData
        } else {
            return null
        }
    }

    on(event, callback) {
        if (!Array.isArray(this._events[event])) {
            this._events[event] = []
        }
        this._events[event].push(callback)
    }

    _call(event, ...args) {
        if (this._events[event]) {
            this._events[event].forEach(callback => {
                callback(...args)
            })
        }
    }

    async _pend() {
        const total_pends = 1
        var pendings = 0

        return new Promise((res, rej) => {
            var check = () => { pendings++; if(pendings == total_pends){ res() }}

            if (!this.inited) {
                this.on("init", () => { check() })
            } else { check() }
        })
    }

    async set(id, key, value) {
        await this._updateData()
        let idData = this._data[id]
        let valueInd = this._data._rowIndex[key]
        value = escape(this._name, valueInd, value)
        if (idData != null) {
            let newDataArray = idData._rowData
            newDataArray[valueInd] = value
            await this._sheet.updateRow(idData._index, newDataArray)
        } else {
            let newRowData = schemas[this._name].map((sch, thisInd) => escape(this._name, thisInd, sch.default))
            newRowData[0] = id
            newRowData[this._data._rowIndex[key]] = value
            await this._sheet.insertRows([newRowData])
        }
        await this._updateData()
    }

    async setUp(id, obj) {
        let idObj = await this.get(id)
        let idData = this._data[id]
        let exists = (idObj != null)

        var rowData = []
        if (exists) {
            rowData = idData._rowData
        } else {
            rowData = schemas[this._name].map((sch, thisInd) => escape(this._name, thisInd, sch.default))
            rowData[0] = id
        }

        Object.keys(obj).forEach(key => {
            var ind = this._data._rowIndex[key]
            var val = obj[key]
            var def = schemas[this._name][ind].default

            rowData[ind] = escape(this._name, ind, val)
        })

        if (exists) {
            await this._sheet.updateRow(idData._index, rowData)
        } else {
            await this._sheet.insertRows([rowData])
        }

        await this._updateData()

        return this._data[id].returnData

        // Basically, this method would allow you to set multiple values on a db
        // Hella useful for initializing a new obj, such as battles where Input a bunch of info
        // Might have to make a new method on the gsheet.js module
        /* Example Usage:

            BattleDB.setUp(battleID, {
                host: interaction.user.id,
                title: battleTitle,
                desc: battleDesc,
                // startTime wouldn't need to be defined because it would be set to the default (Date.now())
                endTime: moment().add(duration, unit).toValue()
            })
        */
        // I would also use this on file uploads and user registration
        // This can be used to create a new db obj, but also update just so you know
        // This means, keys that aren't defined on a new obj will be set to the default value
        // While for preexisting objs, they just remain the same value they currently are!
    }

    async add(id, key, value) {
        await this._updateData()
        let idData = this._data[id]
        let newValue = (idData.returnData[key]+value)
        await this.set(id, key, newValue)
    }

    async sub(id, key, value) {
        await this._updateData()
        let idData = this._data[id]
        let newValue = (idData.returnData[key]-value)
        await this.set(id, key, newValue)
    }

    async push(id, key, value) {
        await this._updateData()
        var tempArr = this._data[id].returnData[key]
        tempArr.push(value)
        await this.set(id, key, tempArr)
    }

    async pull(id, key, value) {
        await this._updateData()
        var tempArr = this._data[id].returnData[key]
        var ind = tempArr.indexOf(value)
        tempArr.splice(ind, 1)
        await this.set(id, key, tempArr)
    }

    async remove(id) {
        await this._updateData()
        let idData = this._data[id]
        if (idData != null) {
            let newDataArray = idData._rowData
            newDataArray[0] = "{DELETE}"
            await this._sheet.updateRow(idData._index, newDataArray)
        }
    }

    async has(key, value) {
        await this._updateData()
        var return_id = null

        Object.keys(this._data).forEach(obj_key => {
            if (!obj_key.startsWith("_")) { // skip lib keys
                let idOdj = this._data[obj_key].returnData
                if (idOdj[key] == value) {
                    return_id = obj_key
                }
            }
        })

        return return_id
    }

    async exists(id) {
        await this._updateData()

        return (this._data[id] != null)
    }

    async match(func) {
        await this._updateData()

        var retArr = []

        Object.keys(this._data).forEach(key => {
            if (key.startsWith("_")) { return }
            var obj = this._data[key].returnData

            if (func(obj) == true) {
                obj.id = key
                retArr.push(obj)
            }
        })

        return retArr
    }

    async getAll(func) {
        let retArr = await this.match((obj) => {return true})
        return retArr
    }

    get size() {
        return new Promise(async (res, rej) => {
            await this._updateData()
            res(Object.values(this._data).length-1)
        })
    }
}

var MemberDB = new Sheet("members")
var ChannelDB = new Sheet("channels")
var BattleDB = new Sheet("battles")
var SongDB = new Sheet("songs")

MemberDB.orig_set = MemberDB.set.bind(MemberDB)
MemberDB.set = async (id, key, value) => {
    var promises = []
    if (key == "channel") {
        promises.push(ChannelDB.set(value, "owner", id))
    }
    promises.push(MemberDB.orig_set(id, key, value))

    await Promise.all(promises)
}

MemberDB.validBadges = (obj) => {
    if (Object.values(obj.badges).some(val => val == true)) {
        let returnArr = []
        Object.keys(obj.badges).forEach((key, i) => {
            if (obj.badges[key] == true) {
                returnArr.push(key)
            }
        })
        return returnArr
    } else {
        return []
    }
}

BattleDB.getActive = async () => {
    return BattleDB.match(obj => {
        print(obj)
        return (Date.now() < obj.endTime)
    })
}

module.exports = { // JukeDB
    MemberDB: MemberDB,
    ChannelDB: ChannelDB,
    BattleDB: BattleDB,
    SongDB: SongDB,
}