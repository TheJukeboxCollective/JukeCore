socket.on("PAGE", (page, format, args) => {
	var mainContainer = new Elem("main")
	mainContainer.clear()
	mainContainer.style = ``

	switch (format) {
		case "PLAIN":
			mainContainer.html = args
		break;
		case "GRID":
			var {gridArea, gridElements, rowCount} = args

			print(gridArea)

			mainContainer.style = `grid-template-areas: ${gridArea}`
			mainContainer.style.setProperty("grid-template-rows", `repeat(${rowCount}, var(--cell-size))`)
			mainContainer.style.setProperty("display", `grid`)

			// mainContainer.html = Object.values(gridElements).map(obj => obj.html).join("\n")

			Object.keys(gridElements).forEach((key, ind) => {
				var obj = gridElements[key]

				var cellElem = new Elem("div")
				cellElem.html = obj.html
				cellElem.classes.add("cellOuter")
				cellElem.classes.add("cell")

				cellElem.id = `main-grid-${key}`
				cellElem.style.setProperty("grid-area", key)

				mainContainer.addChild(cellElem)

				cellElem.children.forEach(elem => {
					elem.classes.add("cellInner")
					elem.classes.add("cell")
				})

				if (obj.hoverText) {
					let fadeElem = new Elem("div")
					fadeElem.html = obj.hoverText
					fadeElem.classes.add("cellHoverText")
					fadeElem.classes.add("cell")
					cellElem.addChild(fadeElem)
					fadeElem.style.setProperty("margin-top", `-${cellElem.height}px`)

					if (obj.click) { fadeElem.setAttr("onClick", obj.click) }

					new ResizeObserver(() => {
						fadeElem.style.setProperty("margin-top", `-${cellElem.height}px`)				
					}).observe(cellElem.elem)
				}
			})
		break;
	}

	eventFire(page+"PageLoad")
})