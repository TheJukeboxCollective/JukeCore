eventListen("battlePageLoad", async () => {
	let battleTitle = new Elem("battle-title")
	let battleDesc = new Elem("battle-desc")
	let battleStatus = new Elem("battle-status")

	let battle_id = window.location.pathname.split("/")[2]

	let battleObj = await JukeDB.BattleDB.get(battle_id)

	battleTitle.text = battleObj.title
	battleDesc.text = battleObj.desc

	let voteTime = battleObj.endTime+((battleObj.endTime - battleObj.startTime)/2)

	if (Date.now() < battleObj.endTime) {
		battleStatus.setAttr("state", "active")
	} else if (Date.now() < voteTime) {
		battleStatus.setAttr("state", "voting"
)	} else {
		battleStatus.setAttr("state", "complete")
	}
})