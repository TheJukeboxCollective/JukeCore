Array.prototype.awaitForEach = async function(func) {
	var proms = []

	this.forEach((...args) => {
		proms.push(func(...args))
	})

	return await Promise.all(proms)
}

Array.prototype.asyncForEach = async function(func) {
    var i = 0
    var length = this.length
    var funcs = []
    return new Promise(async (res, rej) => {
        this.forEach((...args) => {
            funcs.push(func.bind(this, ...args))
        })

        async function loop() {
            await funcs[i]()
            i++
            if (i == length) {
                res()
            } else {
                loop()
            }
        }
        loop()
    })
}