    const print = console.log
    const Datastore = require('@seald-io/nedb')
    const fs = require('fs-extra')
    const path = require('path')

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
        members: {
            name: {type: "String", default: null}, // name
            jukes: {type: "Number", default: 0}, // jukes
            boxes: {type: "Number", default: 0}, // boxes
            golds: {type: "Number", default: 0}, // golds
            silvers: {type: "Number", default: 0}, // silvers
            bronzes: {type: "Number", default: 0}, // bronzes
        },
        battles: {
            host: {type: "String", default: null}, // host_id
            title: {type: "String", default: null}, // title
            desc: {type: "String", default: null}, // desc
            startTime: {type: "Date", default: "NOW"}, // startTime
            endTime: {type: "Date", default: null}, // endTime
        },
        songs: {
            battleID: {type: "String", default: null}, // battle_id
            title: {type: "String", default: null}, // title
            authors: {type: "Array", default: []}, // authors
            votes: {type: "Object", default: ({})}, // votes
            uploadDate: {type: "Date", default: "NOW"}, // uploadDate
            ext: {type: "String", default: null}, // filename
            length: {type: "Number", default: null}, // length
        }
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

    function parseDefault(schema) {
        var {type} = schema
        var value = schema.default

        var newVal = value

        switch (type) {
            case "Date":
                if (value == "NOW") { newVal = Date.now() }
        }

        return newVal
    }

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

    class Database {
        constructor(name) {
            this.inited = false
            this._name = name
            this._path = path.resolve(process.env["database"], `${name}.db`)
            this._db = new Datastore({ filename: this._path })
            this._store = {}

            Promise.all([
                this._db.loadDatabaseAsync(),
                fs.ensureFile(this._path),
            ]).then(() => {
                this.inited = true
                this._call("init")
            })

            this._events = []
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

        default() {
            let thisObj = {}
            let thisSchema = schemas[this._name]
            let properties = Object.keys(schemas[this._name])
            properties.forEach((key) => {
                thisObj[key] = parseDefault(thisSchema[key])
            })
            return thisObj
        }

        async get(id) {
            var toReturn = await this._db.findOneAsync({_id: id})
            return toReturn
        }

        async _pend() {
            // ...
        }

        async set(id, key, value) {
            var setter = {}
            setter[key] = value
            print(setter)

            if (!await this.exists(id)) {var def = this.default(); def._id = id; print(def); await this._db.insertAsync(def)}
            var res = await this._db.updateAsync({ _id: id }, { $set: setter })
            print(res)
        }

        async setUp(id, obj) {
            var exists = await this.exists(id)
            print(exists)

            var currObj;
            if (!exists) {
                currObj = this.default()
                currObj._id = id
            } else {
                currObj = await this.get(id)
            }

            Object.keys(obj).forEach(key => {
                var val = obj[key]
                currObj[key] = val
            })

            print(currObj)

            var doc;
            if (!exists) {
                doc = await this._db.insertAsync(currObj)
            } else {
                doc = (await this._db.updateAsync({_id: id}, { $set: currObj }))
            }

            return doc
        }

        async setOnObj(id, key, objKey, value) {
            var exists = await this.exists(id)
                print(exists)
            if (!exists) {var def = this.default(); def._id = id; await this._db.insertAsync(def)}

            var setter = {}
            var thisGuy = await this.get(id)
            print(thisGuy)
            var objSetter = thisGuy[key]
            objSetter[objKey] = value
            setter[key] = objSetter
            print(setter)

            var res = await this._db.updateAsync({ _id: id }, { $set: setter })
            print(res)
        }

        async add(id, key, value) {
            var obj = await this.get(id)
            let newValue = (obj[key]+value)
            await this.set(id, key, newValue)
        }

        async sub(id, key, value) {
            var obj = await this.get(id)
            let newValue = (obj[key]-value)
            await this.set(id, key, newValue)
        }

        async push(id, key, value) {
            var setter = {}
            setter[key] = value
            if (!this.exists(id)) {var def = this.default(); def._id = id; await this._db.insertAsync(def)}
            await this._db.updateAsync({ _id: id }, { $push: setter })
        }

        async pull(id, key, value) {
            var setter = {}
            setter[key] = value
            if (!this.exists(id)) {var def = this.default(); def._id = id; await this._db.insertAsync(def)}
            await this._db.updateAsync({ _id: id }, { $pull: setter })
        }

        async remove(id) {
            await this._db.removeAsync({ _id: id }, {})
        }

        async has(key, value) {
            var query = {}
            query[key] = value
            var obj = await this._db.findOneAsync(query)
            return obj._id
        }

        async exists(id) {
            var count = await this._db.count({_id: id})
            print(count)
            return (count > 0)
        }

        async match(func) {
            var retArr = []
            var Objs = this._db.getAllData()

            Objs.forEach(obj => {
                if (func(obj) == true) {
                    retArr.push(obj)
                }
            })

            return retArr
        }

        async asyncMatch(func) {
            var retArr = []
            var Objs = this._db.getAllData()

            await Objs.asyncForEach(async obj => {
                if (await func(obj) == true) {
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
            return this._db.getAllData().length
        }
    }

    var MemberDB = new Database("members")
    var BattleDB = new Database("battles")
    var SongDB = new Database("songs")

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

    SongDB.getUserSongs = async (author) => {
        return SongDB.match(obj => obj.authors.includes(author))
    }

    SongDB.getPublicUserSongs = async (author) => {
        var battleCache = {}
        return await SongDB.asyncMatch(async obj => {
            if (obj.authors.includes(author)) {
                var battleObj = (battleCache.hasOwnProperty(obj.battleID) ? battleCache[obj.battleID] : await BattleDB.get(obj.battleID))
                if (battleCache[obj.battleID] == null) { battleCache[obj.battleID] = battleObj }
                var voteTime = (battleObj.endTime+((battleObj.endTime - battleObj.startTime)/2))
                print(Date.now(), " > ", voteTime)
                return (Date.now() > voteTime)
            } else {
                return false
            }
        })
    }

    SongDB.getBattleSongs = async (battle) => {
        return SongDB.match(obj => obj.battleID == battle)
    }

    SongDB.getUserBattleSongs = async (author, battle) => {
        return SongDB.match(obj => (obj.authors.includes(author) && (obj.battleID == battle)))
    }

    module.exports = { // JukeDB
        MemberDB: MemberDB,
        BattleDB: BattleDB,
        SongDB: SongDB,
    }