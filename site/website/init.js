//// Important Global Vars

var socket = io()
var localStorage = window.localStorage

var currPage;
var newPageFuncs = []

const TWT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z" /></svg>`
const SC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.56,8.87V17H20.32V17C22.17,16.87 23,15.73 23,14.33C23,12.85 21.88,11.66 20.38,11.66C20,11.66 19.68,11.74 19.35,11.88C19.11,9.54 17.12,7.71 14.67,7.71C13.5,7.71 12.39,8.15 11.56,8.87M10.68,9.89C10.38,9.71 10.06,9.57 9.71,9.5V17H11.1V9.34C10.95,9.5 10.81,9.7 10.68,9.89M8.33,9.35V17H9.25V9.38C9.06,9.35 8.87,9.34 8.67,9.34C8.55,9.34 8.44,9.34 8.33,9.35M6.5,10V17H7.41V9.54C7.08,9.65 6.77,9.81 6.5,10M4.83,12.5C4.77,12.5 4.71,12.44 4.64,12.41V17H5.56V10.86C5.19,11.34 4.94,11.91 4.83,12.5M2.79,12.22V16.91C3,16.97 3.24,17 3.5,17H3.72V12.14C3.64,12.13 3.56,12.12 3.5,12.12C3.24,12.12 3,12.16 2.79,12.22M1,14.56C1,15.31 1.34,15.97 1.87,16.42V12.71C1.34,13.15 1,13.82 1,14.56Z" /></svg>`
const TTV_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M19.14 11.29L16.29 14.14H13.43L10.93 16.64V14.14H7.71V3.43H19.14Z" /></svg>`
const BC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 15"><path d="M8 0H24L16 15H0L8 0Z"/></svg>`
const YT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" /></svg>`
const TT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>`
const DC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.59 5.88997C17.36 5.31997 16.05 4.89997 14.67 4.65997C14.5 4.95997 14.3 5.36997 14.17 5.69997C12.71 5.47997 11.26 5.47997 9.83001 5.69997C9.69001 5.36997 9.49001 4.95997 9.32001 4.65997C7.94001 4.89997 6.63001 5.31997 5.40001 5.88997C2.92001 9.62997 2.25001 13.28 2.58001 16.87C4.23001 18.1 5.82001 18.84 7.39001 19.33C7.78001 18.8 8.12001 18.23 8.42001 17.64C7.85001 17.43 7.31001 17.16 6.80001 16.85C6.94001 16.75 7.07001 16.64 7.20001 16.54C10.33 18 13.72 18 16.81 16.54C16.94 16.65 17.07 16.75 17.21 16.85C16.7 17.16 16.15 17.42 15.59 17.64C15.89 18.23 16.23 18.8 16.62 19.33C18.19 18.84 19.79 18.1 21.43 16.87C21.82 12.7 20.76 9.08997 18.61 5.88997H18.59ZM8.84001 14.67C7.90001 14.67 7.13001 13.8 7.13001 12.73C7.13001 11.66 7.88001 10.79 8.84001 10.79C9.80001 10.79 10.56 11.66 10.55 12.73C10.55 13.79 9.80001 14.67 8.84001 14.67ZM15.15 14.67C14.21 14.67 13.44 13.8 13.44 12.73C13.44 11.66 14.19 10.79 15.15 10.79C16.11 10.79 16.87 11.66 16.86 12.73C16.86 13.79 16.11 14.67 15.15 14.67Z"/></svg>`
const SP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill-rule="evenodd" clip-rule="evenodd"><path d="M19.098 10.638c-3.868-2.297-10.248-2.508-13.941-1.387-.593.18-1.22-.155-1.399-.748-.18-.593.154-1.22.748-1.4 4.239-1.287 11.285-1.038 15.738 1.605.533.317.708 1.005.392 1.538-.316.533-1.005.709-1.538.392zm-.126 3.403c-.272.44-.847.578-1.287.308-3.225-1.982-8.142-2.557-11.958-1.399-.494.15-1.017-.129-1.167-.623-.149-.495.13-1.016.624-1.167 4.358-1.322 9.776-.682 13.48 1.595.44.27.578.847.308 1.286zm-1.469 3.267c-.215.354-.676.465-1.028.249-2.818-1.722-6.365-2.111-10.542-1.157-.402.092-.803-.16-.895-.562-.092-.403.159-.804.562-.896 4.571-1.045 8.492-.595 11.655 1.338.353.215.464.676.248 1.028zm-5.503-17.308c-6.627 0-12 5.373-12 12 0 6.628 5.373 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12z"/></svg>`
const NG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M 500 0C 224 0 0 224 0 500C 0 776 224 1000 500 1000C 776 1000 1000 776 1000 500C 1000 224 776 0 500 0C 500 0 500 0 500 0 M 133 795C 133 795 127 794 127 794C 83 765 80 700 106 657C 111 623 124 592 153 572C 173 552 194 533 214 514C 213 473 216 432 220 391C 245 367 277 351 302 327C 294 299 294 251 326 238C 354 234 315 205 342 189C 360 152 416 177 411 215C 405 231 393 243 417 251C 430 278 447 294 480 292C 527 298 574 306 621 313C 655 291 692 270 719 237C 747 213 775 186 809 170C 860 152 913 220 879 264C 860 292 823 298 794 312C 759 324 725 334 694 354C 664 362 656 381 671 408C 675 428 706 423 702 448C 739 452 778 451 812 468C 832 486 872 524 851 550C 836 556 829 566 833 582C 834 664 802 751 732 797C 534 797 336 799 138 795C 138 795 133 795 133 795M 224 785C 224 785 231 782 231 782C 257 767 258 703 220 710C 192 724 189 782 224 785M 239 735C 239 735 239 735 239 735C 243 746 233 784 217 765C 189 749 227 696 239 735M 280 780C 280 780 280 780 280 780C 290 787 304 783 312 775C 335 753 338 700 303 689C 266 697 252 755 280 780M 315 741C 315 741 315 741 315 741C 314 752 303 782 289 762C 277 751 274 756 281 747C 251 713 333 682 315 741M 435 786C 435 786 435 786 435 786C 439 783 444 780 448 777C 477 763 459 760 439 756C 457 739 496 752 502 715C 519 697 486 705 477 699C 471 677 512 699 515 683C 525 660 531 631 495 639C 489 613 533 639 531 618C 536 595 534 569 502 576C 493 549 538 578 533 558C 531 548 540 528 523 532C 491 528 458 527 426 526C 425 595 415 667 377 727C 363 750 343 767 325 786C 325 786 435 786 435 786M 738 778C 738 778 738 778 738 778C 739 777 740 776 741 775C 758 765 752 762 736 763C 707 767 738 742 752 751C 766 757 772 745 778 735C 804 709 772 716 759 706C 768 686 806 714 805 679C 833 650 754 659 790 643C 812 648 821 640 819 617C 841 589 771 601 798 584C 818 588 830 580 816 560C 788 555 759 556 731 551C 727 628 713 711 656 768C 622 795 679 784 699 786C 712 784 728 791 738 778M 103 714C 103 714 103 714 103 714C 101 744 119 794 157 776C 194 752 198 693 170 661C 141 659 191 694 177 713C 181 747 147 785 124 744C 106 746 141 729 114 728C 112 714 111 680 103 714M 236 678C 236 678 236 678 236 678C 241 675 246 673 250 671C 242 641 209 697 236 678M 289 647C 289 647 289 647 289 647C 301 669 329 681 352 669C 399 643 411 580 399 532C 402 511 369 493 377 522C 396 564 389 624 349 650C 323 655 328 656 334 648C 322 632 301 614 291 613C 323 615 299 588 283 591C 267 558 272 635 289 647M 257 626C 257 626 257 626 257 626C 257 621 256 617 256 613C 251 581 212 632 194 638C 173 647 201 676 212 656C 227 646 242 636 257 626M 710 541C 710 541 710 541 710 541C 710 500 669 474 631 473C 608 475 559 456 554 475C 577 500 548 519 543 540C 599 546 654 553 710 555C 710 550 710 546 710 541M 686 543C 686 543 686 543 686 543C 688 519 707 556 686 543M 649 541C 649 541 649 541 649 541C 642 522 670 540 649 541M 604 535C 604 535 604 535 604 535C 606 511 624 546 604 535M 562 532C 562 532 562 532 562 532C 555 510 586 535 562 532M 844 531C 844 531 844 530 844 530C 831 497 802 468 764 466C 740 463 716 462 692 460C 718 472 734 500 744 521C 777 525 810 529 844 531M 549 496C 549 496 549 496 549 496C 537 456 499 432 459 432C 424 429 386 422 354 441C 317 456 283 476 251 500C 295 481 336 454 383 444C 416 456 418 507 462 496C 487 493 538 513 549 496M 659 457C 659 457 659 457 659 457C 669 450 703 442 673 435C 592 426 512 414 431 407C 415 423 473 418 485 425C 521 432 547 461 586 457C 609 455 639 471 659 457M 632 419C 632 419 632 419 632 419C 654 424 666 421 655 394C 643 358 628 401 632 419M 605 416C 605 416 605 416 605 416C 615 419 622 416 621 404C 628 375 561 421 605 416M 527 406C 527 406 527 406 527 406C 541 409 543 394 546 384C 547 363 585 347 546 347C 533 349 492 332 493 346C 507 371 480 415 527 406M 470 398C 470 398 470 398 470 398C 480 401 473 390 474 384C 468 356 460 315 504 332C 530 335 557 338 583 342C 597 335 618 319 586 320C 528 311 469 301 410 298C 411 326 425 354 427 382C 426 404 456 394 470 398M 447 388C 447 388 447 388 447 388C 441 361 466 394 447 388M 441 349C 441 349 441 349 441 349C 443 325 460 362 441 349M 433 319C 433 319 433 319 433 319C 426 293 452 326 433 319M 631 347C 631 347 635 345 635 345C 658 324 711 317 709 283C 710 262 696 277 686 283C 645 312 603 339 564 370C 548 413 613 353 631 347M 336 292C 336 292 336 292 336 292C 321 307 354 308 365 295C 377 280 416 292 414 270C 414 233 374 284 356 256C 320 225 346 283 336 292M 741 266C 741 266 746 262 746 262C 768 256 775 216 781 252C 796 284 843 291 865 263C 897 231 862 174 821 179C 783 190 756 222 726 246C 708 259 710 298 735 270C 735 270 741 266 741 266M 849 263C 849 263 849 263 849 263C 840 269 828 271 818 267C 780 258 782 195 821 191C 837 186 863 194 834 205C 817 213 779 259 821 242C 831 236 883 203 861 231C 848 238 786 264 834 256C 851 248 879 246 849 263M 377 234C 377 234 377 234 377 234C 382 236 388 236 392 233C 418 201 347 213 377 234M 376 212C 376 212 383 208 383 208C 391 199 410 225 404 199C 391 181 333 192 369 213C 369 213 376 212 376 212"/></svg>`
const MISC_LINK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z" /></svg>`

//// Utility Functions


const TO = (url, pageLoad, realUrl = url) => {
	// print(url)
	if (currPage != url) {
		socket.emit("PAGE", url)
		if (url != window.location.pathname.slice(0, -1)) {
			window.scrollTo(0, 0)
			if (!pageLoad) { window.history.pushState({page: "newPage"}, "newPage", "/"+realUrl) }
			newPageFuncs.forEach(func => { func() })
			var pageName = window.location.pathname.split("/")[1]
			pageName = (pageName[0].toUpperCase()) + (pageName.slice(1).toLowerCase())
			document.title = `${pageName} 🎶 <JukeBox>`
			// print(document.title)
		}
	}
}

const goto = (url, newTab = true, pageLoad = false) => {
	if (newTab) {
		window.open(url, '_blank')
	} else {
		if (url.startsWith("/")) { url = url.slice(1) }
		TO(url, pageLoad)
	}
}

const switchTo = (url, pageLoad = false, realUrl = window.location.pathname) => {
	if (url.startsWith("/")) { url = url.slice(1) }
	if (realUrl.startsWith("/")) { realUrl = realUrl.slice(1) }
	TO(url, pageLoad, realUrl)
}

function onNewPage(func) {
	newPageFuncs.push(func)
}

function spawnLinkIcon(link) {
	const LINK_LIB = {
		"soundcloud.com": {title: "SoundCloud", svg: SC_SVG, color: "#FF5500"},
		"twitter.com": {title: "Twitter", svg: TWT_SVG, color: "#1C9AEF"},
		"bandcamp.com": {title: "Bandcamp", svg: BC_SVG, color: "#1DA0C3"},
		"youtube.com": {title: "YouTube", svg: YT_SVG, color: "#FF0000"},
		"spotify.com": {title: "Spotify", svg: SP_SVG, color: "#1ED760"},
		"discord.gg": {title: "Discord", svg: DC_SVG, color: "#5A66F2"},
		"newgrounds.com": {title: "Newgrounds", svg: NG_SVG, color: "#FFB50E"},
		"tiktok.com": {title: "TikTok", svg: TT_SVG, color: "#FFFFFF"},
		"twitch.tv": {title: "Twitch", svg: TTV_SVG, color: "#9246FF"},
	}

	if (!link.startsWith("https://")) { link = "https://"+link }
	var linkElem = new Elem("a")
	linkElem.href = link

	let linkKeys = Object.keys(LINK_LIB)
	let {host} = new URL(link)
	let found = false
	for (var i = 0; i < linkKeys.length; i++) {
		var linkKey = linkKeys[i]
		var obj = LINK_LIB[linkKey]

		if (host.includes(linkKey)) {
			linkElem.html = obj.svg
			linkElem.style.setProperty("fill", obj.color)
			linkElem.setAttr("title", obj.title)
			found = true
			break
		}
	}
	if (!found) {
		linkElem.html = MISC_LINK_SVG
		linkElem.style.setProperty("fill", "#FFFFFF")
		linkElem.setAttr("title", host)
	}

	return linkElem
}

function wait(time) {
	return new Promise((res, rej) => {
		setTimeout(() => {
			res()
		}, time)
	})
}

function randi(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function occurrences(string, subString, allowOverlapping = false) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function measureText(text) {
    var canvas = new Elem("canvas")
    var ctx = canvas.elem.getContext("2d")
    ctx.style = "font-family: Big Card;"

    return ctx.measureText(text)
}

Array.prototype.last = function () {
	return this[this.length-1]
}

Array.prototype.asyncForEach = async function(func) {
	var proms = []

	this.forEach((...args) => {
		proms.push(func(...args))
	})

	return await Promise.all(proms)
}

const getCookie = (name) => {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const deleteCookie = (name) => {
  document.cookie = name + '=; max-age=0;';
};

const parseObjectFromCookie = (cookie) => {
  const decodedCookie = decodeURIComponent(cookie);
  return JSON.parse(decodedCookie);
};

//// Anchor Elements do the thing

function THEANCHORFUNC(e, elem) {
	// var elem = e.target
	e.preventDefault()
	let elemURL = new URL(elem.href)
	if (elemURL.host == window.location.host) {
		var dest = elem.href.split(window.location.host)[1]
		let ind = 0
		if (dest.startsWith("/")) {ind = 1}
		var page = dest.split("/")[ind]
		if (Object.keys(SHORTENS).includes(page) && (occurrences(dest, "/") - ind) > 0) { page = SHORTENS[page] }
		switchTo(page, false, dest)
	} else {
		goto(elem.href, true)
	}
}

Object.defineProperty(Elem.prototype, "href", {
	set(val) {
		this._href = val
		this.elem.setAttribute("href", val)
		this.elem.onclick = e => { THEANCHORFUNC.bind(null, e, this.elem)() }
	},

	get() {
		return this._href
	}
})

const SHORTENS = {
	battles: "battle",
	users: "user"
}

function updateAnchors() {
	Array.from(document.querySelectorAll('a')).forEach(elem => {
		elem.onclick = e => { THEANCHORFUNC.bind(null, e, elem)() }
	})
}
updateAnchors()

var Discord = (method, path, data = null) => {
	var access_token = JSON.parse(localStorage.getItem("access")).access_token
	return socket.emitWithAck("discord", access_token, method, path, data)
}
	
var JukeBot = {}
socket.on("jukebot_info", methods => {
	methods.forEach(method => {
		if (!Array.isArray(method)) {
			JukeBot[method] = (...args) => {
				return socket.emitWithAck("jukebot", method, [...args])
			}
		} else { // properties
			JukeBot[method[0]] = method[1]
		}
	})	
})

var JukeDB = {}

socket.on("jukedb_info", DBs => {
	DBs.forEach(DB => {
		JukeDB[DB.title] = {}
		DB.methods.forEach(method => {
			JukeDB[DB.title][method] = async (...args) => {
				return socket.emitWithAck("jukedb", DB.title, method, [...args])
			}
		})
	})
})

var JukeUtils = {}

socket.on("jukeutils_info", methods => {
	methods.forEach(methodObj => {
		var {method, funcString, remote} = methodObj
		if (!remote) {
			funcString = funcString.replace("function (", "function anonymous(")
			// print(funcString)
			JukeUtils[method] = eval(funcString)
		} else {
			JukeUtils[method] = (...args) => {
				return socket.emitWithAck("jukeutils", method, [...args])
			}
		}
	})
})

var {ENV} = parseObjectFromCookie(getCookie("data"))
deleteCookie("data")
// var ENV = {}

// socket.on("envs", envs => {
// 	envs.forEach(env => {
// 		ENV[env.key] = env.value
// 	})
// })

socket.on("updateVote", code => {
	switch (code) {
		case 1:
			print("Stop tryna vote on yo own song, dirty hacker >:(")
		break;
	}
})

new Array("collective", "community").forEach(type => {
	// print(type)
	var dropDown = new Elem(document.querySelector(`.drop-down[${type}]`))

	dropDown.style.setProperty("--drop-down-height", `${dropDown.height}px`)

	new ResizeObserver(() => {
		dropDown.style.setProperty("--drop-down-height", `${dropDown.height}px`)
	}).observe(dropDown.elem)
})

var eventListeners = {}
function eventListen(event, func) {
	if (Array.isArray(eventListeners[event])) {
		eventListeners[event].push(func)
	} else {
		eventListeners[event] = [func]
	}
}

function eventFire(event) {
	if (Array.isArray(eventListeners[event])) {
		eventListeners[event].forEach(func => {
			func()
		})
	}
}

window.onpopstate = e => { newPop() }


function downloadFile(url, fileName){
  fetch(url, { method: 'get', mode: 'no-cors', referrerPolicy: 'no-referrer' })
    .then(res => res.blob())
    .then(res => {
      const aElement = document.createElement('a');
      aElement.setAttribute('download', fileName);
      const href = URL.createObjectURL(res);
      aElement.href = href;
      // aElement.setAttribute('href', href);
      aElement.setAttribute('target', '_blank');
      aElement.click();
      URL.revokeObjectURL(href);
    });
}