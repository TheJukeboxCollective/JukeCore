new MutationObserver((list, observer) => {
	twemoji.parse(document.body, {
		folder: 'svg',
		ext: '.svg'
	})
}).observe(document.body, { attributes: true, childList: true, subtree: true })