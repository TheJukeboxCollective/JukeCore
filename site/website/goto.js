function newPop() {
	let pathBits = window.location.pathname.split("/")

	switch (pathBits[1]) {
		case "battles":
			let pathBits = window.location.pathname.split("/")

			if (pathBits.length >= 3 && pathBits[2] != "") {
				switchTo("battle", true)
			} else {
				switchTo("battles", true)
			}
		break;
		default:
			goto(window.location.pathname.split("/")[1], false, true)
	}
}

newPop()