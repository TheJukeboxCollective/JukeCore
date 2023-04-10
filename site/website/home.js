function makeSocial(icon, url) {
	return {icon: icon, url: url}
}

const Socials = {
	"Discord": makeSocial(DC_SVG, "https://discord.gg/davf72xadC"),
	"Twitter": makeSocial(TWT_SVG, "https://twitter.com/TheJuke3Co"),
	"SoundCloud": makeSocial(SC_SVG, "https://soundcloud.com/TheJuke3Co"),
	"Bandcamp": makeSocial(BC_SVG, "https://thejuke3co.bandcamp.com/"),
	"Youtube": makeSocial(YT_SVG, "https://youtube.com/@TheJuke3Co"),
	"TikTok": makeSocial(TT_SVG, "https://www.tiktok.com/@thejuke3co"),
	"Twitch": makeSocial(TTV_SVG, "https://www.twitch.tv/TheJuke3Co"),
}

eventListen("homePageLoad", async () => {
	Object.keys(Socials).forEach(social_name => {
		var social = Socials[social_name]

		let socialsCont = new Elem("socials-cont")

		let socialElem = new Elem("a")
		socialElem.html = social.icon
		socialElem.href = social.url
		socialElem.setAttr("title", social_name)
		socialElem.setAttr("target", "_blank")
		socialElem.classes.add("jukebox-social-icon")

		socialsCont.addChild(socialElem)
	})
})