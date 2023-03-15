/// Script refactor: Make it await all required promise info at beginning then 
/// before running the rest of logic, check to see if the current page is still the same as before
/* Example:
info = await Promise.all(info)

if (currPage == "battle") {
	...
}
*/

eventListen("battlesPageLoad", async () => {
	// Load Battles
	var battlesCont = new Elem("battles-cont")

	var battles = await JukeDB.BattleDB.getAll()

	battles.sort((a, b) => {
		let theTime = Date.now()

		// Maybe automate this in the sheet using app script 
		let a_voting = (theTime < (a.endTime+((a.endTime - a.startTime)/2)) ? 1 : 0)
		let b_voting = (theTime < (b.endTime+((b.endTime - b.startTime)/2)) ? 1 : 0)

		let a_active = (theTime < a.endTime ? 1 : 0)
		let b_active = (theTime < b.endTime ? 1 : 0)

		if (a_voting != 0 || b_voting != 0) {
			return (b_voting - a_voting)
		} else if (a_active != 0 || b_active != 0) {
			return (b_active - a_active)
		} else {
			return (a.endTime - b.endTime)
		}
	})

	battles.forEach(battleObj => {
		var battleCont = new Elem("div")
		battleCont.classes.add("battle")

		var battleTitle = new Elem("a")
		battleTitle.href = `/battles/${battleObj.id}`
		battleTitle.text = battleObj.title
		battleTitle.classes.add("battle-title")

		var battleTime = new Elem("span")
		let voteTime = battleObj.endTime+((battleObj.endTime - battleObj.startTime)/2)
		let timeStamp = moment(battleObj.endTime).fromNow()
		let voteTimeStamp = moment(voteTime).fromNow()
		if (Date.now() < battleObj.endTime) {
			battleTime.text = `Submissions due ${timeStamp}`
		} else if (Date.now() < voteTime) {
			battleTime.text = `Voting due ${voteTimeStamp}`
		} else {
			battleTime.text = `Battle ended ${timeStamp}`
		}
		battleTime.classes.add("battle-time")
		battleTime.setAttr("title", `Due Date: ${moment(battleObj.endTime).format('MMMM Do YYYY, h:mm a')}`)
		battleTitle.addChild(battleTime)

		battleCont.addChild(battleTitle)

		var battleDesc = new Elem("p")
		battleDesc.text = battleObj.desc
		battleDesc.classes.add("battle-desc")
		battleCont.addChild(battleDesc)

		// battleCont.on("click", e => {
		// 	e.preventDefault()
		// 	switchTo(`battle`, false, `/battles/${battleObj.id}`)
		// })
		updateAnchors()

		battlesCont.addChild(battleCont)
	})
})