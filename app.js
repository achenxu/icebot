const electron = require('electron')
const runInBrowser = require('electron-run-in-browser')
const ipcMain = electron.ipcMain;
// Module to control application life.
const app = electron.app
const loadDevtool = require('electron-load-devtool');
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const url = require('url')
const path = require('path');
var FormData = require('form-data');
var oembetter = require('oembetter')();
var phoneFormatter = require('phone-formatter');
const {
	Menu,
	dialog
} = require('electron');
let mainWindow;
var template = [{
	label: "IceBot Shopify",
	submenu: [{
		label: "About Application",
		selector: "orderFrontStandardAboutPanel:"
	}, {
		type: "separator"
	}, {
		label: "Quit",
		accelerator: "Command+Q",
		click: function() {
			app.quit();
		}
	}]
}, {
	label: "Edit",
	submenu: [{
		label: "Undo",
		accelerator: "CmdOrCtrl+Z",
		selector: "undo:"
	}, {
		label: "Redo",
		accelerator: "Shift+CmdOrCtrl+Z",
		selector: "redo:"
	}, {
		type: "separator"
	}, {
		label: "Cut",
		accelerator: "CmdOrCtrl+X",
		selector: "cut:"
	}, {
		label: "Copy",
		accelerator: "CmdOrCtrl+C",
		selector: "copy:"
	}, {
		label: "Paste",
		accelerator: "CmdOrCtrl+V",
		selector: "paste:"
	}, {
		label: "Select All",
		accelerator: "CmdOrCtrl+A",
		selector: "selectAll:"
	}]
}];
// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

var http = require('http'),
	httpProxy = require('http-proxy');

var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

http.createServer(function(req, res) {
	proxy.web(req, res, {
		target: 'http://localhost:6668'
	});
}).listen(6667);

var sitekeys = [];
var checkoutQueue = [];
var urllist = [];
var waiting = false;
var firsttime = true;

function pushCap(task, url, captcha) {
	let _url = url.replace('https', 'http')
	_url = 'http://checkout.shopify.com/' + _url.split('com/')[1]
	if (captcha !== null && waiting == false) {
		act.show();
		waiting = true;
		checkoutQueue.push(task);
		urllist.push(url);
		sitekeys.push(captcha);
		act.loadURL(_url);
	} else if (captcha !== null && waiting == true) {
		checkoutQueue.push(task);
		urllist.push(url);
		sitekeys.push(captcha);
	} else {
		task.startCheckout(null);
	}
}

var querystring = require('querystring');


function processPost(request, response, callback) {
	var queryData = "";
	if (typeof callback !== 'function') return null;

	if (request.method == 'POST') {
		request.on('data', function(data) {
			queryData += data;
			if (queryData.length > 1e6) {
				queryData = "";
				response.writeHead(413, {
					'Content-Type': 'text/plain'
				}).end();
				request.connection.destroy();
			}
		});

		request.on('end', function() {
			request.post = querystring.parse(queryData);
			callback();
		});

	} else {
		response.writeHead(405, {
			'Content-Type': 'text/plain'
		});
		response.end();
	}
}


http.createServer(function(req, res) {
	if (req.method == 'POST') {
		processPost(req, res, function() {
			let task = checkoutQueue.shift();
			sitekeys.shift()
			task.startCheckout(req.post["g-recaptcha-response"]);
			// Use request.post here

			if (checkoutQueue.length == 0) {
				res.writeHead(200, {
					"Content-Type": "text/html"
				});
				res.write('<html> <head><title> </title><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cabin"> <style> body { -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; font-family: \'Cabin\', serif; } </style> <title>Captcha Harvester</title></head> <body> <center> <header><hgroup><h1>IceBot</h1><h4><b>Captcha Harvester</b></h4></hgroup></header> <img src="http://splashforce.io/splash/lib/loading.gif" style="width:200px;" /><br><p>No tasks currently need captcha tokens.</p></center><script> function sub(){ document.getElementById("submit").click(); }</script> </body></html>');
				res.end();
				waiting = false;
			} else {
				waiting = false;
				pushCap(checkoutQueue.shift(), urllist.shift(), sitekeys.shift())
				res.end();
			}
		});
	} else {
		if (checkoutQueue.length > 0) {
			res.writeHead(200, {
				"Content-Type": "text/html"
			});
			res.write('<html> <head><title> </title><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cabin"> <style> body { -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; font-family: \'Cabin\', serif; } </style> <title>Captcha Harvester</title></head> <body><audio autoplay> <source src="https://s1.vocaroo.com/media/download_temp/Vocaroo_s1paw02t9jzZ.mp3" type="audio/mpeg"></audio> <center> <header><hgroup><h1>IceBot</h1><h4><b>Captcha Harvester</b></h4></hgroup></header> <form action="/submit" method="post"> <div class="g-recaptcha" data-sitekey="' + checkoutQueue[0].sitekey + '" data-callback="sub"></div> <script type="text/javascript" src="https://www.google.com/recaptcha/api.js"></script> <br> <p><input type="submit" value="Submit"></p></form></center><script> function sub(){ document.getElementById("submit").click(); }</script> </body></html>');
			res.end();
		} else {
			res.writeHead(200, {
				"Content-Type": "text/html"
			});
			res.write('<html> <head><title> </title><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cabin"> <style> body { -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; font-family: \'Cabin\', serif; } </style> <title>Captcha Harvester</title></head> <body> <center> <header><hgroup><h1>IceBot</h1><h4><b>Captcha Harvester</b></h4></hgroup></header> <img src="http://splashforce.io/splash/lib/loading.gif" style="width:200px;" /><br><p>No tasks currently need captcha tokens.</p></center><script> function sub(){ document.getElementById("submit").click(); }</script> </body></html>');
			res.end();
		}
	}
}).listen(6668);

const guiWindow = electron.BrowserWindow;
const captchaWindow = electron.BrowserWindow;

// Disable error dialogs by overriding
// FIX: https://goo.gl/YsDdsS
dialog.showErrorBox = function(title, content) {
	console.log(`${title}\n${content}`);
};

app.on('window-all-closed', function() {
	app.quit();
});

function createActivationWindow() {
	aw = new guiWindow({
		title: "IceBot",
		resizable: true,
		width: 450,
		height: 300,
		minWidth: 300,
		minHeight: 300,
		icon: 'img/icon.png',
		center: true,
		frame: false
	});
	aw.loadURL(url.format({
		pathname: path.join(__dirname, 'activate.html'),
		protocol: 'file:',
		slashes: true
	}))

	aw.on('closed', function() {
		aw = null;
	});
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createMainWindow() {
	mainWindow = new guiWindow({
		title: "IceBot",
		resizable: true,
		width: 1250,
		height: 600,
		minWidth: 1250,
		minHeight: 600,
		icon: 'img/icon.png',
		center: true
	});
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindow.on('closed', function() {
		mainWindow = null;
		newWindow = null;
		app.quit()
	});
}


function createCapWindow() {
	act = new captchaWindow({
		title: " ",
		resizable: true,
		width: 350,
		height: 500,
		icon: 'img/icon.png',
		center: true,
		show: false
	});
	var captchaWin = act.webContents.session
	captchaWin.setProxy({
		pacScript: "https://gist.githubusercontent.com/MasonBurdette/874927c39ffa26555a311330b4ad7ddc/raw/4c0da3fe7586508ca998fa1601b38e1ef4af87ee/gistfile1.txt"
	}, function() {
		act.loadURL('http://shop-usa.palaceskateboards.com/waiting_for_captcha/');
	});

	act.on('close', (event) => {

		event.preventDefault()
		act.hide()
	})
}

function createEWindow() {
	act1 = new captchaWindow({
		title: " ",
		resizable: true,
		width: 400,
		height: 400,
		icon: 'img/icon.png',
		center: true
	});

	var captchaWin = act1.webContents.session
	act1.loadURL("https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&service=mail&sacu=1&rip=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin")

	act1.on('closed', function() {
		act1 = null;
		newWindow = null;
	});
}

function createTK() {
	tk = new captchaWindow({
		title: " ",
		resizable: true,
		width: 730,
		height: 500,
		icon: 'img/icon.png',
		center: true,
		show: false,
		frame: false
	});
	tk.loadURL(url.format({
		pathname: path.join(__dirname, 'tk.html'),
		protocol: 'file:',
		slashes: true
	}))

	tk.on('close', (event) => {

		event.preventDefault()
		tk.hide()
	})
}

const request = require('request');
request.defaults = {
	gZip: true,
	followAllRedirects: true,
};

var keys = "";

request({
	url: 'https://gist.githubusercontent.com/MasonBurdette/05b4e6a744491d8ff513be42dbd97358/raw/b5bc1875f2a5e526b0a577547f9e058a2b321cff/keys'
}, function(err, res, body) {
	body = '&' + body.split('\n').join('&') + '&'
	keys = body;
	createActivationWindow();
})


const cheerio = require('cheerio');
const iconv = require('iconv-lite')
const parseUrl = require("parse-url")
const parseString = require('xml2js').parseString

function buildRegEx(str, keywords) {
	return new RegExp("(?=.*?\\b" +
		keywords
		.split(" ")
		.join(")(?=.*?\\b") +
		").*",
		"i"
	);
}

function checkKW(str, keywords, expected) {
	var result = buildRegEx(str, keywords).test(str) === expected
	if (result == true) {
		return true;
	} else {
		return false;
	}
}

const siteTable = {
	"https://us.bape.com/": "BAPE",
	"https://www.bbcicecream.com/": "BILLIONAIRE BOYS CLUB",
	"https://www.blendsus.com/": "BLENDS",
	"https://shop.bdgastore.com/": "BODEGA",
	"https://clot.com/": "CLOT",
	"https://commonwealth-ftgg.com/": "COMMON WEALTH",
	"https://cncpts.com/": "CONCEPTS",
	"https://eflash.doverstreetmarket.com/": "DSM LONDON E-FLASH",
	"https://eflash-us.doverstreetmarket.com/": "DSM NEW YORK E-FLASH",
	"https://shop.exclucitylife.com/": "EXCLUCITY",
	"https://shop.havenshop.ca/": "HAVEN",
	"https://www.highsandlows.net.au/": "HIGHS AND LOWS",
	"https://justdon.com/": "JUST DON",
	"https://kith.com/": "KITH",
	"https://www.lapstoneandhammer.com/": "LAPSTONE & HAMMER",
	"https://www.deadstock.ca/": "LIVESTOCK",
	"https://www.minishopmadrid.com/": "MINI SHOP MADRID",
	"https://nrml.ca/": "NRML",
	"https://shopnicekicks.com/": "NICE KICKS",
	"https://us.octobersveryown.com/": "OVO",
	"https://www.oipolloi.com/": "OI POLLOI",
	"https://packershoes.com/": "PACKER SHOES",
	"https://shop-usa.palaceskateboards.com/": "PALACE",
	"https://properlbc.com/": "PROPER",
	"https://publicschoolnyc.com/": "PUBLIC SCHOOL NYC",
	"https://rsvpgallery.com/": "RSVP GALLERY",
	"https://us.reigningchamp.com/": "REIGNING CHAMP",
	"https://renarts.com/": "RENARTS",
	"http://www.revengexstorm.com/": "REVENGE X STORM",
	"https://www.saintalfred.com/": "SAINT ALFRED",
	"https://sneakerpolitics.com/": "SNEAKER POLITICS",
	"https://www.socialstatuspgh.com/": "SOCIAL STATUS",
	"https://www.trophyroomstore.com/": "TROPHY ROOM",
	"https://shop.undefeated.com/": "UNDEFEATED",
	"https://wishatl.com/": "WISH ATLANTA",
	"https://www.xhibition.co/": "XHIBITION",
	"https://yeezysupply.com/": "YEEZY SUPPLY",
}

class Shopify {

	constructor(id, proxy, product, checkout, login, first, site) {
		proxy.split(':');
		if (proxy.length == 2) {
			this.proxy = 'http://' + proxy[0] + ':' + proxy[1]
		} else if (proxy.length == 4) {
			this.proxy = 'http://' + proxy[0] + ':' + proxy[1] + '@' + proxy[2] + ':' + proxy[3]
		} else {
			this.proxy = null;
		}

		this.started = false;
		this.id = id;
		this.proxy = proxy;
		this.site = siteTable[site];
		this.shopURL = site;
		this.ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';
		this.session = request.jar();
		this.checkout = checkout;
		this.kw = product.pkw.split(",").join(' ');
		this.size = product.size;
		this.found = false;
		this.status = "Idle";
		this.login = login;

		let task = this;


		if (first == true) {
			mainWindow.webContents.send('task', this)
		} else {
			mainWindow.webContents.send(task.id.toString(), 'Idle')
		}
	}

	start() {
		let task = this;
		this.started = true;
		if (this.login.includes(':')) {
			mainWindow.webContents.send(task.id.toString(), 'Logging In...')
			request({
				proxy: task.proxy,
				gZip: true,
				followAllRedirects: true,
				url: task.shopURL + '/account/login',
				form: {
					'form_type': 'customer_login',
					'utf8': '✓',
					'customer[email]': task.login.split(':')[0],
					'customer[password]': task.login.split(':')[1]
				},
				method: 'POST',
				headers: {
					'User-Agent': task.ua
				},
				jar: task.session,
			}, function(err, res, body) {
				if (task.kw.includes('url:')) {
					let productArray = {
						'link': task.kw.split('url:')[1]
					}
					task.status = "Getting product page..";
					task.getVariants(productArray)
				} else if (task.kw.includes('link:')) {
					let productArray = {
						'link': task.kw.split('link:')[1]
					}
					task.status = "Getting product page..";
					task.getVariants(productArray)
				} else if (task.kw.includes('v:')) {
					task.addToCart(task.kw.split('v:')[1]);
				} else if (task.kw.includes('icebot')) {
					mainWindow.webContents.send(task.id.toString(), 'Waiting for product to go live...')
					request({
						url: 'http://htmlecho.trycatch.cc/htmlecho/ibkw?0.3958785339456494'
					}, function(err, res, body) {
						if (body.includes('wait')) {
							let JSONstring = body.split('//START//')[1].split('//END//')[0];
							let array = JSON.parse(JSONstring);
							for (i in array) {
								if (array[i]["public_title"] == task.size) {
									task.addToCart(array[i]["id"]);
								}
							}
						} else {
							setTimeout(function() {
								if (task.started == true) {
									task.start();
								}
							}, 500)
						}
					})
				} {
					task.search();
				}
			})
		} else {
			if (task.kw.includes('url:')) {
				let productArray = {
					'link': task.kw.split('url:')[1]
				}
				task.status = "Getting product page..";
				task.getVariants(productArray)
			} else if (task.kw.includes('link:')) {
				let productArray = {
					'link': task.kw.split('link:')[1]
				}
				task.status = "Getting product page..";
				task.getVariants(productArray)
			} else if (task.kw.includes('v:')) {
				task.addToCart(task.kw.split('v:')[1])
			} else if (task.kw.includes('icebot')) {
				mainWindow.webContents.send(task.id.toString(), 'Waiting for product to go live...')
				request({
					url: 'http://htmlecho.trycatch.cc/htmlecho/ibkw?0.3958785339456494'
				}, function(err, res, body) {
					if (body.includes('wait')) {
						let JSONstring = body.split('//START//')[1].split('//END//')[0];
						let array = JSON.parse(JSONstring);
						for (i in array) {
							if (array[i]["public_title"] == task.size) {
								task.addToCart(array[i]["id"]);
							}
						}
					} else {
						setTimeout(function() {
							if (task.started == true) {
								task.start();
							}
						}, 500)
					}
				})
			} else {
				task.search();
			}
		}
	}

	search() {
		let task = this;
		if (task.started == true) {
			console.log(this.kw);
			mainWindow.webContents.send(task.id.toString(), 'Finding Product...');
			console.log(task.id.toString() + " : Looking..");
			request({
				proxy: task.proxy,
				gZip: true,
				followAllRedirects: true,
				url: task.shopURL + 'sitemap_products_1.xml',
				method: 'GET',
				encoding: null,
				headers: {
					'User-Agent': task.ua
				},
				jar: task.session,

			}, function(err, res, body) {
				if (!err && res.statusCode == 200) {
					let bodyWithCorrectEncoding = iconv.decode(body, 'iso-8859-1');

					parseString(bodyWithCorrectEncoding, function(err, result) {
						let response = {
							productDetails: []
						}
						if (!err && result) {
							let products = result.urlset.url

							for (let i = 0; i < products.length; i++) {

								if (products[i]['image:image'] !== undefined) {
									let name = products[i]['image:image'][0]['image:title'][0]
									let image = products[i]['image:image'][0]['image:loc'][0]
									let productArray = {
										name: name,
										link: products[i].loc[0],
										image: image
									}

									let pmatch = checkKW(productArray.name, task.kw, true);

									if (pmatch == true && task.found == false) {
										task.found = true;
										task.getVariants(productArray);
									}
								}
								if (products.length - 1 == i) {
									if (task.found == false) {
										setTimeout(function() {
											if (task.started == true) {
												task.search();
											}
										}, 1500)
									}
								}
							}
						} else {
							setTimeout(function() {
								if (task.started == true) {
									task.search()
								}
							}, 100)
						}
					})
				} else {

					setTimeout(function() {
						if (task.started == true) {
							task.search()
						}
					}, 100)
				}
			})
		}
	}

	getVariants(productArray) {
		let task = this;
		mainWindow.webContents.send(task.id.toString(), 'Getting Variants...')
		request({
			proxy: task.proxy,
			gZip: true,
			followAllRedirects: true,
			url: productArray.link + '.json',
			method: 'GET',
			headers: {
				'User-Agent': task.ua
			},
			jar: task.session,

		}, function(err, res, body) {
			if (!err && res.statusCode == 200) {
				let array = JSON.parse(body);
				let vfound = false;
				for (let i in array["product"]["variants"]) {
					let match1 = (array["product"]["variants"][i]["option1"] == task.size);
					let match2 = (array["product"]["variants"][i]["option2"] == task.size);
					let match3 = (array["product"]["variants"][i]["option3"] == task.size);
					if (match1 == true || match2 == true || match3 == true) {
						if (vfound == false) {
							vfound = true;
							mainWindow.webContents.send(task.id.toString(), 'Adding to Cart...')
							task.addToCart(array["product"]["variants"][i]["id"]);
						}
					}
					if (i + 1 == array["product"]["variants"].length && vfound == false) {
						mainWindow.webContents.send(task.id.toString(), 'Variant Not Found!')
					}
				}
			}
		})
	}

	addToCart(variant) {
		let task = this;
		request({
			proxy: task.proxy,
			gZip: true,
			followAllRedirects: true,
			url: task.shopURL + 'cart/add.js',
			method: 'POST',
			headers: {
				'User-Agent': task.ua,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			jar: task.session,
			form: {
				'id': variant,
				'quantity': '1'
			}
		}, function(err, res, body) {
			request({
				proxy: task.proxy,
				gZip: true,
				followAllRedirects: true,
				url: task.shopURL + 'checkout',
				method: 'GET',
				headers: {
					'User-Agent': task.ua,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				jar: task.session,
			}, function(err, res, body) {
				if (!err) {
					let $ = cheerio.load(body);
					if (res.request.uri.href.includes("throttle") || res.request.uri.href.includes("queue")) {
						mainWindow.webContents.send(task.id.toString(), 'Waiting in Queue...')
						task.pollQueue(res.request.uri.href);
					} else if (res.request.uri.href.includes('stock_problems')) {
						mainWindow.webContents.send(task.id.toString(), 'Out of Stock!')
					} else {
						if (task.site == "PALACE") {
							request({
								proxy: task.proxy,
								gZip: true,
								followAllRedirects: true,
								url: 'https://shop-usa.palaceskateboards.com/cart',
								method: 'GET',
								headers: {
									'User-Agent': task.ua
								},
								jar: task.session
							}, function(err, res, body) {
								let bnote = body.split('<input type="hidden" name="note" id="note" value="')[1].split('" />')[0];
								let bvar = body.split(']" id="updates_')[1].split('"')[0];
								let bname = `updates[${bvar}]`;
								console.log({
									checkout: 'Checkout',
									note: bnote,
									[bname]: '1'
								})
								request({
									proxy: task.proxy,
									gZip: true,
									followAllRedirects: true,
									url: 'https://shop-usa.palaceskateboards.com/cart',
									method: 'POST',
									headers: {
										'User-Agent': task.ua
									},
									jar: task.session,
									form: {
										checkout: 'Checkout',
										note: bnote,
										[bname]: '1'
									}
								}, function(err, res, body) {
									console.log(body)
									console.log(res.request.uri.href)
									task.storeID = res.request.uri.href.split('/checkouts/')[0].split('/')[3];
									task.checkoutID = res.request.uri.href.split("checkouts/")[1].split('"')[0];
									console.log(task.storeID, task.checkoutID)
									task.checkoutURL = `${task.shopURL}${task.storeID}/checkouts/${task.checkoutID}`;
									mainWindow.webContents.send(task.id.toString(), 'Added to Cart!');
									task.sitekey = body.split('sitekey: "')[1];
									if (task.sitekey) {
										task.sitekey = task.sitekey.split('"')[0];
										mainWindow.webContents.send(task.id.toString(), 'Waiting for Captcha...')
									} else {
										task.sitekey = null;
									}
									task.at = body.split('name="authenticity_token" value="')[1].split('"')[0];
									pushCap(task, task.checkoutURL, task.sitekey);
								})
							})
						} else {
							console.log(res.request.uri.href)
							task.storeID = res.request.uri.href.split('/checkouts/')[0].split('/')[3];
							task.checkoutID = res.request.uri.href.split("checkouts/")[1].split('"')[0];
							console.log(task.storeID, task.checkoutID)
							task.checkoutURL = `${task.shopURL}${task.storeID}/checkouts/${task.checkoutID}`;
							mainWindow.webContents.send(task.id.toString(), 'Added to Cart!');
							task.sitekey = body.split('sitekey: "')[1];
							if (task.sitekey) {
								task.sitekey = task.sitekey.split('"')[0];
								mainWindow.webContents.send(task.id.toString(), 'Waiting for Captcha...')
							} else {
								task.sitekey = null;
							}
							task.at = body.split('name="authenticity_token" value="')[1].split('"')[0];
							pushCap(task, task.checkoutURL, task.sitekey);
						}
					}
				}
			})
		})
	}

	pollQueue(url) {
		let task = this;
		request({
			proxy: task.proxy,
			gZip: true,
			followAllRedirects: true,
			url: url,
			method: 'GET',
			headers: {
				'User-Agent': task.ua
			},
			jar: task.session,
		}, function(err, res, body) {
			if (!err) {
				let $ = cheerio.load(body);
				if (res.request.uri.href.includes("throttle") || res.request.uri.href.includes("queue")) {
					mainWindow.webContents.send(task.id.toString(), 'Waiting in Queue...')
					task.pollQueue(res.request.uri.href);
				} else if (body.includes('stock_problems')) {
					mainWindow.webContents.send(task.id.toString(), 'Out of Stock!')
				} else {
					if (task.site == "PALACE") {
						request({
							proxy: task.proxy,
							gZip: true,
							followAllRedirects: true,
							url: 'https://shop-usa.palaceskateboards.com/cart',
							method: 'GET',
							headers: {
								'User-Agent': task.ua
							},
							jar: task.session
						}, function(err, res, body) {
							let bnote = body.split('<input type="hidden" name="note" id="note" value="')[1].split('" />')[0];
							let bvar = body.split(']" id="updates_')[1].split('"')[0];
							let bname = `updates[${bvar}]`;
							console.log({
								checkout: 'Checkout',
								note: bnote,
								[bname]: '1'
							})
							request({
								proxy: task.proxy,
								gZip: true,
								followAllRedirects: true,
								url: 'https://shop-usa.palaceskateboards.com/cart',
								method: 'POST',
								headers: {
									'User-Agent': task.ua
								},
								jar: task.session,
								form: {
									checkout: 'Checkout',
									note: bnote,
									[bname]: '1'
								}
							}, function(err, res, body) {
								console.log(body)
								console.log(res.request.uri.href)
								task.storeID = res.request.uri.href.split('/checkouts/')[0].split('/')[3];
								task.checkoutID = res.request.uri.href.split("checkouts/")[1].split('"')[0];
								console.log(task.storeID, task.checkoutID)
								task.checkoutURL = `${task.shopURL}${task.storeID}/checkouts/${task.checkoutID}`;
								mainWindow.webContents.send(task.id.toString(), 'Added to Cart!');
								task.sitekey = body.split('sitekey: "')[1];
								if (task.sitekey) {
									task.sitekey = task.sitekey.split('"')[0];
									mainWindow.webContents.send(task.id.toString(), 'Waiting for Captcha...')
								} else {
									task.sitekey = null;
								}
								task.at = body.split('name="authenticity_token" value="')[1].split('"')[0];
								pushCap(task, task.checkoutURL, task.sitekey);
							})
						})
					} else {
						task.storeID = res.request.uri.href.split("/checkouts/")[0].split('/')[1];
						task.checkoutID = res.request.uri.href.split("checkouts/")[1].split('"')[0];
						task.checkoutURL = `${task.shopURL}${task.storeID}/checkouts/${task.checkoutID}`;
						mainWindow.webContents.send(task.id.toString(), 'Added to Cart!')
						request({
							proxy: task.proxy,
							gZip: true,
							followAllRedirects: true,
							url: task.checkoutURL,
							method: 'GET',
							headers: {
								'User-Agent': task.ua
							},
							jar: task.session,

						}, function(err, res, body) {
							console.log(res.request.uri.href)
							task.storeID = res.request.uri.href.split('/checkouts/')[0].split('/')[3];
							task.checkoutID = res.request.uri.href.split("checkouts/")[1].split('"')[0];
							task.checkoutURL = `${task.shopURL}${task.storeID}/checkouts/${task.checkoutID}`;
							mainWindow.webContents.send(task.id.toString(), 'Added to Cart!');
							task.sitekey = body.split('sitekey: "')[1];
							if (task.sitekey) {
								task.sitekey = task.sitekey.split('"')[0];
								mainWindow.webContents.send(task.id.toString(), 'Waiting for Captcha...')
							} else {
								task.sitekey = null;
							}
							task.at = body.split('name="authenticity_token" value="')[1].split('"')[0];
							pushCap(task, task.checkoutURL, task.sitekey);
						})
					}
				}
			}
		})
	}

	startCheckout(response) {
		let task = this;
		mainWindow.webContents.send(task.id.toString(), 'Retrieving Checkout Form...')
		request({
			proxy: task.proxy,
			gZip: true,
			followAllRedirects: true,
			url: task.checkoutURL,
			method: 'GET',
			headers: {
				'User-Agent': task.ua,
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				Referer: task.shopURL,
				'Accept-Language': 'en-US,en;q=0.8',
			},
			jar: task.session,

			qs: {
				utf8: '✓',
				_method: 'patch',
				authenticity_token: task.at,
				previous_step: 'contact_information',
				'checkout[email]': task.checkout.email,
				'checkout[shipping_address][first_name]': task.checkout.fname,
				'checkout[shipping_address][last_name]': task.checkout.lname,
				'checkout[shipping_address][company]': '',
				'checkout[shipping_address][address1]': task.checkout.address,
				'checkout[shipping_address][address2]': '',
				'checkout[shipping_address][city]': task.checkout.city,
				'checkout[shipping_address][country]': 'United States',
				'checkout[shipping_address][province]': task.checkout.state,
				'checkout[shipping_address][zip]': task.checkout.zip,
				'checkout[shipping_address][phone]': task.checkout.phone,
				'checkout[remember_me]': '0',
				'checkout[client_details][browser_width]': '979',
				'checkout[client_details][browser_height]': '631',
				'checkout[client_details][javascript_enabled]': '1',
				step: 'contact_information'
			}
		}, function(err, res, body) {
			let $ = cheerio.load(body);
			task.at = $('form.edit_checkout input[name=authenticity_token]').attr('value');
			mainWindow.webContents.send(task.id.toString(), 'Sending Contact Info...')
			request({
				proxy: task.proxy,
				gZip: true,
				followAllRedirects: true,
				url: task.checkoutURL,
				method: 'POST',
				headers: {
					'User-Agent': task.ua,
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					Referer: task.shopURL,
					'Accept-Language': 'en-US,en;q=0.8',
				},
				jar: task.session,

				form: {
					utf8: '✓',
					_method: 'patch',
					authenticity_token: task.at,
					previous_step: 'contact_information',
					'checkout[email]': task.checkout.email,
					'checkout[shipping_address][first_name]': task.checkout.fname,
					'checkout[shipping_address][last_name]': task.checkout.lname,
					'checkout[shipping_address][company]': '',
					'checkout[shipping_address][address1]': task.checkout.address,
					'checkout[shipping_address][address2]': '',
					'checkout[shipping_address][city]': task.checkout.city,
					'checkout[shipping_address][country]': 'United States',
					'checkout[shipping_address][province]': task.checkout.state,
					'checkout[shipping_address][zip]': task.checkout.zip,
					'checkout[shipping_address][phone]': task.checkout.phone,
					'checkout[remember_me]': '0',
					'checkout[client_details][browser_width]': '979',
					'checkout[client_details][browser_height]': '631',
					'checkout[client_details][javascript_enabled]': '1',
					step: 'shipping_method',
					'g-recaptcha-response': response
				}
			}, function(err, res, body) {
				if (body.includes("error-for-captcha")) {
					mainWindow.webContents.send(task.id.toString(), 'Invalid Captcha!')
				} else {
					request({
						proxy: task.proxy,
						gZip: true,
						followAllRedirects: true,
						url: task.checkoutURL,
						method: 'GET',
						headers: {
							'User-Agent': task.ua,
							Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
							Referer: task.shopURL,
							'Accept-Language': 'en-US,en;q=0.8',
						},
						jar: task.session,

					}, function(err, res, body) {
						mainWindow.webContents.send(task.id.toString(), 'Retrieving Shipping Form...');

						request({
							proxy: task.proxy,
							gZip: true,
							followAllRedirects: true,
							url: task.checkoutURL,
							method: 'GET',
							headers: {
								'User-Agent': task.ua,
								Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
								Referer: task.shopURL,
								'Accept-Language': 'en-US,en;q=0.8',
							},
							jar: task.session,
						}, function(err, res, body) {
							task.sm = body.split('data-shipping-method="')[1].split('"')[0];
							task.at = $('input[name="authenticity_token"]').val();
							mainWindow.webContents.send(task.id.toString(), 'Sending Shipping Info...')
							request({
								proxy: task.proxy,
								gZip: true,
								followAllRedirects: true,
								url: task.checkoutURL,
								method: 'POST',
								headers: {
									'User-Agent': task.ua,
									Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
									Referer: task.shopURL,
									'Accept-Language': 'en-US,en;q=0.8',
								},
								jar: task.session,

								form: {
									utf8: '✓',
									_method: 'patch',
									authenticity_token: task.at,
									button: '',
									previous_step: 'shipping_method',
									step: 'payment_method',
									'checkout[shipping_rate][id]': task.sm
								}
							}, function(err, res, body) {
								mainWindow.webContents.send(task.id.toString(), 'Retrieving Payment Form...')
								request({
									proxy: task.proxy,
									gZip: true,
									followAllRedirects: true,
									url: task.checkoutURL,
									method: 'GET',
									headers: {
										'User-Agent': task.ua,
										Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
										Referer: task.shopURL,
										'Accept-Language': 'en-US,en;q=0.8',
									},
									jar: task.session,

								}, function(err, res, body) {
									let $ = cheerio.load(body);
									task.price = $('input[name="checkout[total_price]"]').attr('value');
									task.gateway = $('input[name="checkout[payment_gateway]"]').attr('value');
									task.at = $('form[data-payment-form=""] input[name="authenticity_token"]').attr('value');

									mainWindow.webContents.send(task.id.toString(), 'Retrieving Payment Gateway/Token...')
									request({
										url: 'https://elb.deposit.shopifycs.com/sessions',
										followAllRedirects: true,
										method: 'options',
										encoding: 'utf-8',
										gzip: true,
										headers: {
											'User-Agent': task.ua,
											'Accept-Encoding': 'gzip, deflate, br',
											'Accept-Language': 'en-US,en;q=0.8',
											'Access-Control-Request-Headers': 'content-type',
											'Access-Control-Request-Method': 'POST',
											'Connection': 'keep-alive',
											'Upgrade-Insecure-Requests': '1',
											'Orgin': 'https://checkout.shopifycs.com',
											'content-type': 'application/json',
											'Host': 'elb.deposit.shopifycs.com',
											'Referer': `https://checkout.shopifycs.com/number?identifier=${task.checkoutID}&location=https%3A%2F%2Fcheckout.shopify.com%2F${task.storeID}%2Fcheckouts%2F${task.checkoutID}%3Fprevious_step%3Dshipping_method%26step%3Dpayment_method`
										},

									}, function(err, res, body) {
										if (err || body === undefined) {
											console.log("error has occured");
										}
										let CCnumF = task.checkout.ccn.match(/.{1,4}/g).join(' ');
										let CCname = task.checkout.fname + ' ' + task.checkout.lname;
										let ccForm = {
											"credit_card": {
												"number": CCnumF,
												"name": CCname,
												"month": parseInt(task.checkout.ccmonth),
												"year": parseInt(task.checkout.ccyear),
												"verification_value": task.checkout.ccv
											}
										};
										request({
											url: 'https://elb.deposit.shopifycs.com/sessions',
											followAllRedirects: true,
											method: 'POST',
											encoding: 'utf-8',
											gzip: true,
											headers: {
												'accept': 'application/json',
												'Origin': 'https://checkout.shopifycs.com',
												'Accept-Language': 'en-US,en;q=0.8',
												'Host': 'elb.deposit.shopifycs.com',
												'content-type': 'application/json',
												'Referer': `https://checkout.shopifycs.com/number?identifier=${task.checkoutID}&location=https%3A%2F%2Fcheckout.shopify.com%2F${task.storeID}%2Fcheckouts%2F${task.checkoutID}%3Fprevious_step%3Dshipping_method%26step%3Dpayment_method`,
												'User-Agent': task.ua
											},
											body: JSON.stringify(ccForm)
										}, function(err, res, body) {
											let sValue = JSON.parse(body).id;
											mainWindow.webContents.send(task.id.toString(), 'Sending Payment Info...')
											task.pf = phoneFormatter.format(
												task.checkout.phone,
												'(NNN) NNN-NNNN'
											)
											let finalForm = {
												utf8: '✓',
												_method: 'patch',
												authenticity_token: task.at,
												previous_step: 'payment_method',
												step: '',
												's': sValue,
												'checkout[payment_gateway]': task.gateway,
												'checkout[credit_card][vault]': 'false',
												'checkout[different_billing_address]': 'false',
												'checkout[billing_address][first_name]': task.checkout.fname,
												'checkout[billing_address][last_name]': task.checkout.lname,
												'checkout[billing_address][company]': '',
												'checkout[billing_address][address1]': task.checkout.address,
												'checkout[billing_address][address2]': '',
												'checkout[billing_address][city]': task.checkout.city,
												'checkout[billing_address][country]': 'United States',
												'checkout[billing_address][province]': task.checkout.state,
												'checkout[billing_address][zip]': task.checkout.zip,
												'checkout[billing_address][phone]': task.pf,
												'checkout[total_price]': task.price,
												complete: '1',
												'checkout[client_details][browser_width]': '979',
												'checkout[client_details][browser_height]': '631',
												'checkout[client_details][javascript_enabled]': '1',
											}
											request({
												proxy: task.proxy,
												gZip: true,
												followAllRedirects: true,
												url: task.checkoutURL,
												method: 'POST',
												headers: {
													'Content-Type': 'application/x-www-form-urlencoded',
													'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
													'Accept-Language': 'en-US,en;q=0.8',
													'User-Agent': task.ua,
												},
												jar: task.session,
												form: finalForm
											}, function(err, res, body) {
												if (body.includes("Checkout - Processing")) {
													mainWindow.webContents.send(task.id.toString(), 'Checkout Submitted!');
													task.pollCheckout();
												} else {
													mainWindow.webContents.send(task.id.toString(), 'Checkout Failed!');
												}
											})
										})
									})
								})
							})
						})
					})
				}
			})
		})
	}

	pollCheckout() {
		let task = this;
		request({
			proxy: task.proxy,
			gZip: true,
			followAllRedirects: true,
			url: task.checkout,
			method: 'GET',
			headers: {
				'User-Agent': task.ua
			},
			jar: task.session,
		}, function(err, res, body) {
			console.log(body)
		})
	}

}

var clear = require('clear');
clear();

var WebSocketServer = require('websocket').server;
var http = require('http');
var servers = http.createServer(function(request, response) {
	response.writeHead(404);
	response.end();
});
servers.listen(8080, function() {});
wsServer = new WebSocketServer({
	httpServer: servers,
	autoAcceptConnections: false
});

function originIsAllowed(origin) {
	return true;
}

wsServer.on('request', function(request) {
	var connection = request.accept('', request.origin);
	connection.on('message', function(message) {
		if (message.utf8Data == "cp") {
			act.show();
		}
		if (message.utf8Data == "ce") {
			createEWindow();
		}
		let string = "<tbody>";
		for (i in tasks) {
			if (tasks[i].status !== "Idle" || tasks[i].status !== "Invalid Captcha!" || tasks[i].status !== "Checkout Submitted!" || tasks[i].status !== "Checkout Failed!") {
				string = string + '<tr> <td>' + tasks[i].id + '</td> <td>' + tasks[i].site + '</td> <td>' + tasks[i].status + '</td> <td>' + tasks[i].kw + '</td> <td>' + tasks[i].size + '</td> <td><button class="btn btn-mini btn-negative">Stop Task</button><button class="btn btn-mini btn-negative">Delete Task</button></td> </tr>'
			} else {
				string = string + '<tr> <td>' + tasks[i].id + '</td> <td>' + tasks[i].site + '</td> <td>' + tasks[i].status + '</td> <td>' + tasks[i].kw + '</td> <td>' + tasks[i].size + '</td> <td><button class="btn btn-mini btn-positive">Start Task</button><button class="btn btn-mini btn-negative">Delete Task</button></td> </tr>'
			}
		}
		string = string;
		connection.sendUTF(string);
	});
	connection.on('close', function(reasonCode, description) {
		app.quit()
	});
});

var tasks = [];

ipcMain.on('start', function(event, data) {
	tasks[data].start();
	mainWindow.webContents.send('turnToStop')
})
ipcMain.on('stop', function(event, data) {
	for (i in checkoutQueue) {
		if (checkoutQueue[i].id == data) {
			checkoutQueue.splice(i, 1)
			if (checkoutQueue.length == 0) {
				waiting = false;
			}
			act.reload();
		}
	}
	tasks[data].started = false;
	tasks[data] = new Shopify(tasks[data].id, tasks[data].proxy, {
		pkw: tasks[data].kw,
		size: tasks[data].size
	}, {
		email: tasks[data].checkout.email,
		fname: tasks[data].checkout.fname,
		lname: tasks[data].checkout.lname,
		address: tasks[data].checkout.address,
		city: tasks[data].checkout.city,
		state: tasks[data].checkout.state,
		zip: tasks[data].checkout.zip,
		phone: tasks[data].checkout.phone,
		ccn: tasks[data].checkout.ccn,
		ccmonth: tasks[data].checkout.ccmonth,
		ccyear: tasks[data].checkout.ccyear,
		ccv: tasks[data].checkout.ccv
	}, tasks[data].login, false, tasks[data].site)
})
ipcMain.on('new', function(event, data) {
	tasks[tasks.length] = new Shopify(tasks.length, data.proxy, {
		pkw: data.kw,
		size: data.size
	}, {
		email: data.email,
		fname: data.fname,
		lname: data.lname,
		address: data.address,
		city: data.city,
		state: data.state,
		zip: data.zip,
		phone: data.phone,
		ccn: data.ccn,
		ccmonth: data.ccm,
		ccyear: data.ccy,
		ccv: data.ccv
	}, data.login, true, data.site)
})

ipcMain.on('delete', function(event, data) {
	for (i in checkoutQueue) {
		if (checkoutQueue[i].id == data) {
			checkoutQueue.splice(i, 1)
			if (checkoutQueue.length == 0) {
				waiting = false;
			}
			act.reload();
		}
	}
	tasks[data].started = false;
	tasks[data] = null;
	mainWindow.webContents.send(data + 'del')
})

ipcMain.on('tk', function(event, data) {
	tk.show();
})

ipcMain.on('quitBot', function(event, data) {
	app.quit();
})

ipcMain.on('activate', function(event, data) {
	data = data.split(' ').join('');
	if (keys.includes('&' + data + '&')) {
		createCapWindow();
		createMainWindow();
		createTK();
		aw.close();
	} else {
		aw.webContents.send('wrong');
	}
})